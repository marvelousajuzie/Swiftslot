import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Calendar, Clock, User, DollarSign, Loader2, CheckCircle, AlertCircle, X } from "lucide-react"
import { formatDate, formatTime, generateIdempotencyKey } from "../lib/utils"
import { api, type Vendor, type TimeSlot, type Booking } from "../lib/api"
import { useToast } from "../components/ui/toast"
import { MockPaymentGateway } from "./mock-payment-gateway"
import { PaymentStatus } from "./payment-status"
import { validateBookingTime } from "../lib/booking-validation"


interface BookingPanelProps {
  vendor: Vendor
  selectedSlot: TimeSlot
  selectedDate: string
  onClose: () => void
  onBookingComplete: (booking: Booking) => void
}

type BookingState = "review" | "booking" | "payment" | "processing" | "complete" | "failed"

export function BookingPanel({ vendor, selectedSlot, selectedDate, onClose, onBookingComplete }: BookingPanelProps) {
  const [state, setState] = useState<BookingState>("review")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [paymentRef, setPaymentRef] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()


  const startTime = new Date(selectedSlot.startUtc)
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)
  const mockPrice = 50.0

  const handleCreateBooking = async () => {

    const validation = validateBookingTime(selectedSlot.startUtc, selectedDate)

    if (!validation.valid) {
      console.log("❌ Validation failed:", validation.message)
      setError(validation.message!)
      setState("failed")
      toast({
        title: "Invalid Booking Time",
        description: validation.message,
        variant: "destructive",
      })
      return
    }

    console.log("✅ Validation passed, proceeding with booking")

    setState("booking")
    setError(null)

    try {
      const startTime = new Date(selectedSlot.startUtc)
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)

      const startISO = selectedSlot.startUtc
      const endISO = endTime.toISOString()

  
      if (vendor.id === undefined || vendor.id === null) {
        throw new Error("Vendor ID is missing or null")
      }
      if (!startISO || startISO === undefined) {
        throw new Error("Start ISO is missing or undefined")
      }
      if (!endISO || endISO === undefined) {
        throw new Error("End ISO is missing or undefined")
      }

      const idempotencyKey = generateIdempotencyKey()

      const bookingResponse = await api.createBooking(vendor.id, startISO, endISO, idempotencyKey)

      if (!bookingResponse.success || !bookingResponse.data) {
        throw new Error(bookingResponse.error || "Failed to create booking")
      }

      const newBooking = bookingResponse.data
      setBooking(newBooking)

      const paymentResponse = await api.initializePayment(newBooking.id)

      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error(paymentResponse.error || "Failed to initialize payment")
      }

      setPaymentRef(paymentResponse.data.ref)
      setState("payment")
    } catch (error) {
      console.error("=== BOOKING ERROR ===", error)

      let errorTitle = "Booking Failed"
      let errorMessage = "An unexpected error occurred"

      if (error instanceof Error) {
        const message = error.message.toLowerCase()

        if (message.includes("2 hours from now") || message.includes("minimum booking time")) {
          errorTitle = "Booking Too Soon"
          errorMessage =
            "Please select a time slot that's at least 2 hours from the current Lagos time. This ensures adequate preparation time for your appointment."
        } else if (message.includes("conflict") || message.includes("already booked") || message.includes("409")) {
          errorTitle = "Slot No Longer Available"
          errorMessage =
            "This time slot was just booked by another user. Please refresh the calendar and select a different time."
        } else if (message.includes("vendor")) {
          errorTitle = "Vendor Error"
          errorMessage = "There was an issue with the selected vendor. Please try refreshing the page."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      setState("failed")

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handlePaymentSuccess = async () => {
    if (!paymentRef) return

    setState("processing")

    try {

      const webhookResponse = await api.mockPaymentSuccess(paymentRef)

      if (!webhookResponse.success) {
        throw new Error(webhookResponse.error || "Payment processing failed")
      }

    } catch (error) {
      console.error("Payment processing error:", error)
      setError(error instanceof Error ? error.message : "Payment processing failed")
      setState("failed")
    }
  }

  const handlePaymentFailed = (errorMessage: string) => {
    setError(errorMessage)
    setState("failed")
    toast({
      title: "Payment Failed",
      description: errorMessage,
      variant: "destructive",
    })
  }

  const handlePaymentComplete = (completedBooking: Booking) => {
    setBooking(completedBooking)
    setState("complete")
    onBookingComplete(completedBooking)
    toast({
      title: "Booking Confirmed!",
      description: `Your appointment with ${vendor.name} has been confirmed.`,
      variant: "success",
    })
  }

  const handleCancel = () => {
    setState("review")
    setError(null)
  }

  const handleClose = () => {
    onClose()
  }


  if (state === "payment") {
    return (
      <MockPaymentGateway
        amount={mockPrice}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={handlePaymentFailed}
        onCancel={handleCancel}
      />
    )
  }


  if (state === "processing" && booking) {
    return (
      <PaymentStatus
        bookingId={booking.id}
        onPaymentComplete={handlePaymentComplete}
        onPaymentFailed={handlePaymentFailed}
      />
    )
  }

  if (state === "complete" && booking) {
    return (
      <Card className="w-full glass border-accent/20 animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <CardTitle className="text-2xl text-accent font-bold">Booking Confirmed!</CardTitle>
          <p className="text-muted-foreground">Your appointment has been successfully scheduled</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-6 space-y-4 border border-accent/10">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{vendor.name}</div>
                <div className="text-sm text-muted-foreground">Service Provider</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{formatDate(selectedDate)}</div>
                <div className="text-sm text-muted-foreground">Appointment Date</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {booking.startTimeLagos} - {booking.endTimeLagos}
                </div>
                <div className="text-sm text-muted-foreground">Africa/Lagos Time</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="font-semibold text-foreground">${mockPrice.toFixed(2)}</div>
                <div className="text-sm text-accent font-medium">Payment Confirmed</div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">Booking Reference</p>
            <p className="text-xs font-mono text-muted-foreground bg-background px-3 py-1 rounded border">
              {booking.id}
            </p>
            <p className="text-xs text-muted-foreground">You will receive a confirmation email shortly</p>
          </div>

          <Button onClick={handleClose} className="w-full h-12 text-base font-medium">
            Complete Booking
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (state === "failed") {
    return (
      <Card className="w-full border-destructive/20 animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">Booking Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm leading-relaxed">{error}</p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => setState("review")} className="w-full h-12">
              Try Again
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full h-12 bg-transparent">
              Cancel Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full glass animate-fade-in">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Review & Checkout</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-muted-foreground">Confirm your booking details</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{vendor.name}</div>
              <div className="text-sm text-muted-foreground">Service Provider</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-foreground">{formatDate(selectedDate)}</div>
                <div className="text-xs text-muted-foreground">Date</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {selectedSlot.startLagos} - {formatTime(new Date(endTime.getTime()).toISOString().slice(11, 16))}
                </div>
                <div className="text-xs text-muted-foreground">Lagos Time</div>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            UTC: {new Date(selectedSlot.startUtc).toISOString().slice(11, 16)} - {endTime.toISOString().slice(11, 16)}
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <span className="font-semibold text-foreground">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-accent">${mockPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCreateBooking}
            disabled={state === "booking"}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {state === "booking" ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Booking...
              </>
            ) : (
              "Confirm & Pay"
            )}
          </Button>

          <Button variant="outline" onClick={handleClose} className="w-full h-12 bg-transparent">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}