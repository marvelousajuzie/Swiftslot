import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { CreditCard, Lock, Loader2 } from "lucide-react"

interface MockPaymentGatewayProps {
  amount: number
  onPaymentSuccess: () => void
  onPaymentFailed: (error: string) => void
  onCancel: () => void
}

export function MockPaymentGateway({ amount, onPaymentSuccess, onPaymentFailed, onCancel }: MockPaymentGatewayProps) {
  const [processing, setProcessing] = useState(false)
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111")
  const [expiryDate, setExpiryDate] = useState("12/25")
  const [cvv, setCvv] = useState("123")

  const handlePayment = async () => {
    setProcessing(true)


    await new Promise((resolve) => setTimeout(resolve, 2000))


    const isSuccess = Math.random() > 0.1

    if (isSuccess) {
      onPaymentSuccess()
    } else {
      onPaymentFailed("Payment declined by bank")
    }

    setProcessing(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Secure Payment</CardTitle>
        <p className="text-sm text-muted-foreground">Complete your booking payment</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total Amount</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background mt-1"
              placeholder="1234 5678 9012 3456"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background mt-1"
                placeholder="123"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Your payment is secured with 256-bit SSL encryption</span>
        </div>

        <div className="space-y-2">
          <Button onClick={handlePayment} disabled={processing} className="w-full" size="lg">
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>

          <Button variant="outline" onClick={onCancel} disabled={processing} className="w-full bg-transparent">
            Cancel
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          <p>This is a mock payment gateway for demonstration purposes.</p>
          <p>No real payment will be processed.</p>
        </div>
      </CardContent>
    </Card>
  )
}
