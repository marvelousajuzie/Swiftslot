import type { Request, Response } from "express"
import { v4 as uuidv4 } from "uuid"
import { Payment, Booking } from "../models"
import { IdempotencyManager } from "../utils/idempotency"

export class PaymentController {
  /**
   * POST /api/payments/initialize - Initialize payment
   * Body: { bookingId }
   */
  static async initializePayment(req: Request, res: Response) {
    try {
      const { bookingId } = req.body

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: "bookingId is required",
        })
      }

      // Validate booking exists and is in pending state
      const booking = await Booking.findByPk(bookingId)
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        })
      }

      if (booking.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "Booking is not in pending state",
        })
      }

      // Check if payment already exists
      let payment = await Payment.findOne({ where: { bookingId } })

      if (!payment) {
        // Create new payment with unique reference
        const paymentRef = `pay_${uuidv4().replace(/-/g, "").substring(0, 16)}`

        payment = await Payment.create({
          bookingId,
          ref: paymentRef,
          status: "pending",
          rawEventJson: {
            initialized_at: new Date().toISOString(),
            amount: 50.0, // Mock amount
            currency: "USD",
          },
        })
      }

      res.json({
        success: true,
        data: {
          ref: payment.ref,
          status: payment.status,
          amount: 50.0,
          currency: "USD",
        },
      })
    } catch (error) {
      console.error("Error initializing payment:", error)
      res.status(500).json({
        success: false,
        error: "Failed to initialize payment",
      })
    }
  }

  /**
   * POST /api/payments/webhook - Mock payment webhook
   * Body: { event: 'charge.success', data: { reference: string } }
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const { event, data } = req.body

      if (!event || !data || !data.reference) {
        return res.status(400).json({
          success: false,
          error: "Invalid webhook payload. Expected: { event, data: { reference } }",
        })
      }

      // Only handle successful charge events
      if (event !== "charge.success") {
        return res.json({
          success: true,
          message: `Event '${event}' ignored`,
        })
      }

      const { reference } = data

      // Check idempotency for webhook (prevent duplicate processing)
      const idempotencyKey = `webhook_${reference}`
      const idempotencyCheck = await IdempotencyManager.checkIdempotency(idempotencyKey, "webhook", {
        event,
        reference,
      })

      if (idempotencyCheck.isReplay) {
        return res.json(idempotencyCheck.cachedResponse)
      }

      // Find payment by reference
      const payment = await Payment.findOne({
        where: { ref: reference },
        include: [{ model: Booking }],
      })

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: `Payment with reference '${reference}' not found`,
        })
      }

      // Update payment and booking status (idempotent operation)
      const wasAlreadySuccessful = payment.status === "success"

      if (!wasAlreadySuccessful) {
        // Update payment status
        await payment.update({
          status: "success",
          rawEventJson: {
            ...payment.rawEventJson,
            webhook_received_at: new Date().toISOString(),
            event_data: req.body,
          },
        })

        // Update booking status
        await payment.Booking.update({
          status: "paid",
        })
      }

      const responseData = {
        success: true,
        data: {
          reference,
          payment_status: "success",
          booking_status: "paid",
          bookingId: payment.bookingId,
          processed_at: new Date().toISOString(),
          was_already_processed: wasAlreadySuccessful,
        },
      }

      // Store idempotency key
      await IdempotencyManager.storeIdempotency(idempotencyKey, "webhook", { event, reference }, responseData)

      res.json(responseData)
    } catch (error) {
      console.error("Error handling webhook:", error)
      res.status(500).json({
        success: false,
        error: "Failed to process webhook",
      })
    }
  }

  /**
   * GET /api/payments/:ref - Get payment status by reference
   */
  static async getPaymentStatus(req: Request, res: Response) {
    try {
      const { ref } = req.params

      const payment = await Payment.findOne({
        where: { ref },
        include: [
          {
            model: Booking,
            attributes: ["id", "status", "startTimeUtc", "endTimeUtc"],
          },
        ],
      })

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: "Payment not found",
        })
      }

      res.json({
        success: true,
        data: {
          ref: payment.ref,
          status: payment.status,
          bookingId: payment.bookingId,
          booking: payment.Booking,
          createdAt: payment.createdAt.toISOString(),
        },
      })
    } catch (error) {
      console.error("Error fetching payment status:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch payment status",
      })
    }
  }
}
