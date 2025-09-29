import request from "supertest"
import app from "../app"

describe("SwiftSlot API", () => {

  const getUniqueTimeSlot = () => {
    const timestamp = Date.now()
    const startDate = new Date(timestamp + 24 * 60 * 60 * 1000) 
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000) 
    
    return {
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString()
    }
  }

  // Vendor routes
  it("GET /api/vendors -> should return list of vendors", async () => {
    const res = await request(app).get("/api/vendors")
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it("GET /api/vendors/:id/availability -> should return availability", async () => {
    const res = await request(app).get("/api/vendors/1/availability?date=2025-10-01")
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("slots")
  })

  // Booking routes
  it("POST /api/bookings -> should create a booking", async () => {
    const { startISO, endISO } = getUniqueTimeSlot()

    const res = await request(app)
      .post("/api/bookings")
      .send({ vendorId: 1, startISO, endISO })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty("id")
  })

  it("GET /api/bookings/:id -> should return a booking", async () => {
    const { startISO, endISO } = getUniqueTimeSlot()

    const bookingRes = await request(app)
      .post("/api/bookings")
      .send({ vendorId: 1, startISO, endISO })

    const id = bookingRes.body.data.id
    expect(id).toBeDefined()

    console.log("Booking POST response:", bookingRes.body)

    const res = await request(app).get(`/api/bookings/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("id", id)
  })

  it("POST /api/payments/initialize -> should initialize a payment", async () => {
    const { startISO, endISO } = getUniqueTimeSlot()
    

    const bookingRes = await request(app)
      .post("/api/bookings")
      .send({
        vendorId: 1,
        startISO,
        endISO,
      })

    const bookingId = bookingRes.body.data?.id
    expect(bookingId).toBeDefined()


    const res = await request(app)
      .post("/api/payments/initialize")
      .send({ bookingId })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("data.ref")
  })
})