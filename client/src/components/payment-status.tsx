"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { api, type Booking } from "../lib/api"

interface PaymentStatusProps {
  bookingId: number
  onPaymentComplete: (booking: Booking) => void
  onPaymentFailed: (error: string) => void
}

export function PaymentStatus({ bookingId, onPaymentComplete, onPaymentFailed }: PaymentStatusProps) {
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing")
  const [booking, setBooking] = useState<Booking | null>(null)

  useEffect(() => {
    let pollCount = 0
    const maxPolls = 20 

    const pollBookingStatus = async () => {
      try {
        const response = await api.getBooking(bookingId)

        if (response.success && response.data) {
          setBooking(response.data)

          if (response.data.status === "paid") {
            setStatus("success")
            onPaymentComplete(response.data)
            return
          }

          if (response.data.status === "cancelled") {
            setStatus("failed")
            onPaymentFailed("Payment was cancelled")
            return
          }
        }

        pollCount++
        if (pollCount < maxPolls) {
          setTimeout(pollBookingStatus, 500)
        } else {
          setStatus("failed")
          onPaymentFailed("Payment confirmation timeout")
        }
      } catch (error) {
        setStatus("failed")
        onPaymentFailed("Failed to verify payment status")
      }
    }

    pollBookingStatus()
  }, [bookingId, onPaymentComplete, onPaymentFailed])

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
          {status === "processing" && (
            <div className="bg-blue-100 w-full h-full rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="bg-emerald-100 w-full h-full rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          )}
          {status === "failed" && (
            <div className="bg-red-100 w-full h-full rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>
        <CardTitle>
          {status === "processing" && "Processing Payment..."}
          {status === "success" && "Payment Successful!"}
          {status === "failed" && "Payment Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {status === "processing" && (
          <p className="text-muted-foreground">
            Please wait while we confirm your payment. This usually takes a few seconds.
          </p>
        )}
        {status === "success" && booking && (
          <div className="space-y-2">
            <p className="text-emerald-600 font-medium">Your booking has been confirmed!</p>
            <p className="text-sm text-muted-foreground">Booking ID: {booking.id}</p>
          </div>
        )}
        {status === "failed" && (
          <p className="text-red-600">There was an issue processing your payment. Please try again.</p>
        )}
      </CardContent>
    </Card>
  )
}
