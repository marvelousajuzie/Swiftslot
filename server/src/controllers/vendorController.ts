import type { Request, Response } from "express"
import { Vendor, BookingSlot } from "../models"
import { TimezoneUtils } from "../utils/timezone"

export class VendorController {

  static async getVendors(req: Request, res: Response) {
    try {
      const vendors = await Vendor.findAll({
        attributes: ["id", "name", "timezone"],
        order: [["name", "ASC"]],
      })

      res.json({
        success: true,
        data: vendors,
      })
    } catch (error) {
      console.error("Error fetching vendors:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch vendors",
      })
    }
  }

  /**
   * GET /api/vendors/:id/availability?date=YYYY-MM-DD
   * Returns available 30-minute slots in UTC
   */
  static async getAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { date } = req.query

      if (!date || typeof date !== "string") {
        return res.status(400).json({
          success: false,
          error: "Date parameter is required (YYYY-MM-DD format)",
        })
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD",
        })
      }

      const vendor = await Vendor.findByPk(id)
      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: "Vendor not found",
        })
      }


      const allSlots = TimezoneUtils.generateDaySlots(date)

  
      const bookedSlots = await BookingSlot.findAll({
        where: {
          vendorId: id,
          slotStartUtc: allSlots,
        },
        attributes: ["slotStartUtc"],
      })

      const bookedTimes = new Set(bookedSlots.map((slot) => slot.slotStartUtc.toISOString()))

   
      const availableSlots = allSlots
        .filter((slot) => !bookedTimes.has(slot.toISOString()))
        .map((slot) => ({
          startUtc: slot.toISOString(),
          startLagos: TimezoneUtils.utcToLagos(slot),
        }))

      res.json({
        success: true,
        data: {
          vendorId: Number.parseInt(id),
          date,
          timezone: "Africa/Lagos",
          slots: availableSlots,
        },
      })
    } catch (error) {
      console.error("Error fetching availability:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch availability",
      })
    }
  }
}
