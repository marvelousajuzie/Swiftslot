const API_BASE =
  import.meta.env.MODE === "production" 
    ? import.meta.env.VITE_API_URL || "/api" 
    : "http://localhost:3001/api"

export interface Vendor {
  id: number
  name: string
  timezone: string
}

export interface TimeSlot {
  startUtc: string
  startLagos: string
}

export interface AvailabilityResponse {
  vendorId: number
  date: string
  timezone: string
  slots: TimeSlot[]
}

export interface Booking {
  id: number
  vendorId: number
  vendor?: Vendor
  startTimeUtc: string
  endTimeUtc: string
  startTimeLagos?: string
  endTimeLagos?: string
  status: "pending" | "paid" | "cancelled"
  createdAt: string
}

export interface Payment {
  ref: string
  status: "pending" | "success" | "failed"
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async getVendors(): Promise<{ success: boolean; data?: Vendor[]; error?: string }> {
    return this.request<Vendor[]>("/vendors")
  }

  async getAvailability(
    vendorId: number,
    date: string,
  ): Promise<{ success: boolean; data?: AvailabilityResponse; error?: string }> {
    return this.request<AvailabilityResponse>(`/vendors/${vendorId}/availability?date=${date}`)
  }

  async createBooking(
    vendorId: number,
    startISO: string,
    endISO: string,
    idempotencyKey: string,
  ): Promise<{ success: boolean; data?: Booking; error?: string }> {
    console.log("=== API CLIENT DEBUG ===")
    console.log("API Client received:")
    console.log("- vendorId:", vendorId, typeof vendorId)
    console.log("- startISO:", startISO, typeof startISO)
    console.log("- endISO:", endISO, typeof endISO)
    console.log("- idempotencyKey:", idempotencyKey, typeof idempotencyKey)

    const requestBody = {
      vendorId,
      startISO,
      endISO,
    }

    console.log("API Client request body:", JSON.stringify(requestBody))
    console.log("API_BASE:", API_BASE)
    console.log("Full endpoint:", `${API_BASE}/bookings`)

    const headers = {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    }
    
    console.log("Request headers:", headers)
    console.log("Request body string:", JSON.stringify(requestBody))

    try {
      console.log("Making fetch request...")
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log("Response body:", result)

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      console.log("=== API CLIENT SUCCESS ===")
      return result
    } catch (error) {
      console.error("=== API CLIENT ERROR ===")
      console.error("Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async getBooking(bookingId: number): Promise<{ success: boolean; data?: Booking; error?: string }> {
    return this.request<Booking>(`/bookings/${bookingId}`)
  }

  async initializePayment(bookingId: number): Promise<{ success: boolean; data?: Payment; error?: string }> {
    return this.request<Payment>("/payments/initialize", {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    })
  }

  async mockPaymentSuccess(reference: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.request("/payments/webhook", {
      method: "POST",
      body: JSON.stringify({
        event: "charge.success",
        data: { reference },
      }),
    })
  }
}

export const api = new ApiClient()