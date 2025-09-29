import type { Request, Response } from "express"
import type { Transaction } from "sequelize"
import { Booking, BookingSlot, Vendor, sequelize } from "../models"
import { TimezoneUtils } from "../utils/timezone"
import { IdempotencyManager } from "../utils/idempotency"
import { Router } from "express"



export class BookingController {


static async createBooking(req: Request, res: Response) {
  const transaction: Transaction = await sequelize.transaction()

  try {
   
    console.log("=== BACKEND DEBUG START ===")
    console.log("Request method:", req.method)
    console.log("Request URL:", req.url)
    console.log("Request headers:", req.headers)
    console.log("Raw request body:", req.body)
    console.log("Body type:", typeof req.body)
    console.log("Is body object?", typeof req.body === 'object' && req.body !== null)
    
    const { vendorId, startISO, endISO } = req.body
    const idempotencyKey = req.headers["idempotency-key"] as string


    console.log("Extracted parameters:")
    console.log("- vendorId:", vendorId, "type:", typeof vendorId, "truthy:", !!vendorId)
    console.log("- startISO:", startISO, "type:", typeof startISO, "truthy:", !!startISO)  
    console.log("- endISO:", endISO, "type:", typeof endISO, "truthy:", !!endISO)
    console.log("- idempotencyKey:", idempotencyKey, "type:", typeof idempotencyKey)
    

    const vendorIdMissing = !vendorId
    const startISOMissing = !startISO
    const endISOMissing = !endISO
    
    console.log("Validation checks:")
    console.log("- vendorId missing:", vendorIdMissing)
    console.log("- startISO missing:", startISOMissing)
    console.log("- endISO missing:", endISOMissing)
    console.log("=== BACKEND DEBUG END ===")
  if (!vendorId || !startISO || !endISO) {
      console.log("VALIDATION FAILED - Rolling back transaction")
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        error: "vendorId, startISO, and endISO are required",
      })
    }


    const idempotencyCheck = await IdempotencyManager.checkIdempotency(idempotencyKey, "booking", {
      vendorId,
      startISO,
      endISO,
    })

    if (idempotencyCheck.isReplay) {
      await transaction.rollback()
      return res.json(idempotencyCheck.cachedResponse)
    }

 
    const vendor = await Vendor.findByPk(vendorId)
    if (!vendor) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        error: "Vendor not found",
      })
    }

    const startTime = new Date(startISO)
    const endTime = new Date(endISO)


    const timeValidation = TimezoneUtils.validateBookingTime(startTime)
    if (!timeValidation.valid) {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        error: timeValidation.error,
      })
    }

    const booking = await Booking.create(
      {
        vendorId,
        buyerId: "anonymous",
        startTimeUtc: startTime,
        endTimeUtc: endTime,
        status: "pending",
      },
      { transaction },
    )


    const slots: Date[] = []
    const current = new Date(startTime)

    while (current < endTime) {
      slots.push(new Date(current))
      current.setMinutes(current.getMinutes() + 30)
    }

    try {
 
      await BookingSlot.bulkCreate(
        slots.map((slot) => ({
          bookingId: booking.id,
          vendorId,
          slotStartUtc: slot,
        })),
        { transaction },
      )
    } catch (error: any) {
      await transaction.rollback()

   
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
          success: false,
          error: "One or more time slots are no longer available. Please refresh and try again.",
        })
      }

      throw error
    }

    await transaction.commit()

    const responseData = {
      success: true,
      data: {
        id: booking.id,
        vendorId: booking.vendorId,
        startTimeUtc: booking.startTimeUtc.toISOString(),
        endTimeUtc: booking.endTimeUtc.toISOString(),
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
      },
    }

    if (idempotencyKey) {
      await IdempotencyManager.storeIdempotency(
        idempotencyKey,
        "booking",
        { vendorId, startISO, endISO },
        responseData,
      )
    }

    console.log("BOOKING CREATED SUCCESSFULLY:", responseData)
    res.status(201).json(responseData)
  } catch (error) {
    await transaction.rollback()
    console.error("Error creating booking:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create booking",
    })
  }
}



  


 
  static async getBooking(req: Request, res: Response) {
    try {
      const { id } = req.params

      const booking = await Booking.findByPk(id, {
        include: [
          {
            model: Vendor,
            attributes: ["id", "name", "timezone"],
          },
        ],
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        })
      }

      res.json({
        success: true,
        data: {
          id: booking.id,
          vendorId: booking.vendorId,
          vendor: booking.Vendor,
          startTimeUtc: booking.startTimeUtc.toISOString(),
          endTimeUtc: booking.endTimeUtc.toISOString(),
          startTimeLagos: TimezoneUtils.utcToLagos(booking.startTimeUtc),
          endTimeLagos: TimezoneUtils.utcToLagos(booking.endTimeUtc),
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
        },
      })
    } catch (error) {
      console.error("Error fetching booking:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch booking",
      })
    }
  }
}



console.log("DEBUG: Creating router")
console.log("DEBUG: Controllers imported:", { 
  BookingController, 
})

const router = Router()


console.log("DEBUG: Setting up booking routes")
router.post("/bookings", BookingController.createBooking)
router.get("/bookings/:id", BookingController.getBooking)

export default router
