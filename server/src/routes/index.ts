import { Router } from "express"
import { VendorController } from "../controllers/vendorController"
import { BookingController } from "../controllers/bookingController"
import { PaymentController } from "../controllers/paymentController"

const router = Router()


console.log("BookingController imported:", BookingController)
console.log("createBooking method exists:", typeof BookingController.createBooking)


// Vendor routes
router.get("/vendors", VendorController.getVendors)
router.get("/vendors/:id/availability", VendorController.getAvailability)

// Booking routes
router.post("/bookings", BookingController.createBooking)
router.get("/bookings/:id", BookingController.getBooking)

// Payment routes
router.post("/payments/initialize", PaymentController.initializePayment)
router.post("/payments/webhook", PaymentController.handleWebhook)
router.get("/payments/:ref", PaymentController.getPaymentStatus)

export default router
