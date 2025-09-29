/**
 * Integration test script for SwiftSlot
 * Tests the complete booking flow end-to-end
 */

const API_BASE = "http://localhost:3001/api"

interface TestResult {
  test: string
  success: boolean
  error?: string
  data?: any
}

class IntegrationTester {
  private results: TestResult[] = []

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || "Unknown error"}`)
    }

    return data
  }

  private addResult(test: string, success: boolean, error?: string, data?: any) {
    this.results.push({ test, success, error, data })
    console.log(`${success ? "✅" : "❌"} ${test}${error ? `: ${error}` : ""}`)
  }

  async testVendorsList() {
    try {
      const response = await this.request("/vendors")

      if (!response.success || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error("No vendors returned")
      }

      this.addResult("Vendors List", true, undefined, response.data)
    } catch (error) {
      this.addResult("Vendors List", false, error instanceof Error ? error.message : "Unknown error")
    }
  }

  async testAvailability() {
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await this.request(`/vendors/1/availability?date=${today}`)

      if (!response.success || !response.data || !Array.isArray(response.data.slots)) {
        throw new Error("Invalid availability response")
      }

      this.addResult("Availability Check", true, undefined, {
        date: today,
        slotsCount: response.data.slots.length,
      })

      return response.data.slots[0] // Return first available slot for booking test
    } catch (error) {
      this.addResult("Availability Check", false, error instanceof Error ? error.message : "Unknown error")
      return null
    }
  }

  async testBookingCreation(slot: any) {
    if (!slot) {
      this.addResult("Booking Creation", false, "No available slot to test")
      return null
    }

    try {
      const startTime = new Date(slot.startUtc)
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)
      const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const response = await this.request("/bookings", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          vendorId: 1,
          startISO: startTime.toISOString(),
          endISO: endTime.toISOString(),
        }),
      })

      if (!response.success || !response.data || !response.data.id) {
        throw new Error("Invalid booking response")
      }

      this.addResult("Booking Creation", true, undefined, {
        bookingId: response.data.id,
        status: response.data.status,
      })

      return response.data
    } catch (error) {
      this.addResult("Booking Creation", false, error instanceof Error ? error.message : "Unknown error")
      return null
    }
  }

  async testIdempotency(slot: any) {
    if (!slot) {
      this.addResult("Idempotency Test", false, "No available slot to test")
      return
    }

    try {
      const startTime = new Date(slot.startUtc)
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)
      const idempotencyKey = `idempotency-test-${Date.now()}`

      // First request
      const response1 = await this.request("/bookings", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          vendorId: 1,
          startISO: startTime.toISOString(),
          endISO: endTime.toISOString(),
        }),
      })

      // Second request with same key
      const response2 = await this.request("/bookings", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          vendorId: 1,
          startISO: startTime.toISOString(),
          endISO: endTime.toISOString(),
        }),
      })

      if (response1.data.id !== response2.data.id) {
        throw new Error("Idempotency failed - different booking IDs returned")
      }

      this.addResult("Idempotency Test", true, undefined, {
        bookingId: response1.data.id,
        sameResponse: true,
      })
    } catch (error) {
      this.addResult("Idempotency Test", false, error instanceof Error ? error.message : "Unknown error")
    }
  }

  async testConflictPrevention(slot: any) {
    if (!slot) {
      this.addResult("Conflict Prevention", false, "No available slot to test")
      return
    }

    try {
      const startTime = new Date(slot.startUtc)
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)

      // First booking
      const response1 = await this.request("/bookings", {
        method: "POST",
        headers: {
          "Idempotency-Key": `conflict-test-1-${Date.now()}`,
        },
        body: JSON.stringify({
          vendorId: 1,
          startISO: startTime.toISOString(),
          endISO: endTime.toISOString(),
        }),
      })

      // Second booking for same slot (should fail)
      try {
        await this.request("/bookings", {
          method: "POST",
          headers: {
            "Idempotency-Key": `conflict-test-2-${Date.now()}`,
          },
          body: JSON.stringify({
            vendorId: 1,
            startISO: startTime.toISOString(),
            endISO: endTime.toISOString(),
          }),
        })

        throw new Error("Second booking should have failed with 409 Conflict")
      } catch (conflictError) {
        if (conflictError instanceof Error && conflictError.message.includes("409")) {
          this.addResult("Conflict Prevention", true, undefined, {
            firstBookingId: response1.data.id,
            conflictDetected: true,
          })
        } else {
          throw conflictError
        }
      }
    } catch (error) {
      this.addResult("Conflict Prevention", false, error instanceof Error ? error.message : "Unknown error")
    }
  }

  async testPaymentFlow(booking: any) {
    if (!booking) {
      this.addResult("Payment Flow", false, "No booking to test payment")
      return
    }

    try {
      // Initialize payment
      const paymentResponse = await this.request("/payments/initialize", {
        method: "POST",
        body: JSON.stringify({
          bookingId: booking.id,
        }),
      })

      if (!paymentResponse.success || !paymentResponse.data.ref) {
        throw new Error("Payment initialization failed")
      }

      const paymentRef = paymentResponse.data.ref

      // Mock payment success webhook
      const webhookResponse = await this.request("/payments/webhook", {
        method: "POST",
        body: JSON.stringify({
          event: "charge.success",
          data: { reference: paymentRef },
        }),
      })

      if (!webhookResponse.success) {
        throw new Error("Payment webhook failed")
      }

      // Verify booking status updated
      const bookingCheck = await this.request(`/bookings/${booking.id}`)

      if (bookingCheck.data.status !== "paid") {
        throw new Error("Booking status not updated to paid")
      }

      this.addResult("Payment Flow", true, undefined, {
        paymentRef,
        bookingStatus: bookingCheck.data.status,
      })
    } catch (error) {
      this.addResult("Payment Flow", false, error instanceof Error ? error.message : "Unknown error")
    }
  }

  async runAllTests() {
    console.log("🚀 Starting SwiftSlot Integration Tests...\n")

    // Test 1: Vendors list
    await this.testVendorsList()

    // Test 2: Availability check
    const availableSlot = await this.testAvailability()

    // Test 3: Booking creation
    const booking = await this.testBookingCreation(availableSlot)

    // Test 4: Idempotency
    await this.testIdempotency(availableSlot)

    // Test 5: Conflict prevention
    await this.testConflictPrevention(availableSlot)

    // Test 6: Payment flow
    await this.testPaymentFlow(booking)

    // Summary
    console.log("\n📊 Test Results Summary:")
    const passed = this.results.filter((r) => r.success).length
    const total = this.results.length

    console.log(`✅ Passed: ${passed}/${total}`)
    console.log(`❌ Failed: ${total - passed}/${total}`)

    if (passed === total) {
      console.log("\n🎉 All tests passed! SwiftSlot is working correctly.")
    } else {
      console.log("\n⚠️  Some tests failed. Check the errors above.")
    }

    return { passed, total, results: this.results }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new IntegrationTester()
  tester.runAllTests().catch(console.error)
}

export { IntegrationTester }
