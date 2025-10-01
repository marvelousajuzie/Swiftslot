import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { TimeSlot } from "../components/time-slot"
import { BookingPanel } from "../components/booking-panel"
import { ArrowLeft, Calendar, Clock, RefreshCw, Info, CheckCircle2, MapPin, Star } from "lucide-react"
import {
  api,
  type Vendor,
  type AvailabilityResponse,
  type TimeSlot as TimeSlotType,
  type Booking,
} from "../lib/api"
import { useToast } from "../components/ui/toast"
import { formatDate } from "../lib/utils"
import { Link } from "react-router-dom"


export const validateBookingTime = (
  slotStartUtc: string,
  selectedDate: string,
): { valid: boolean; message?: string } => {
  const now = new Date()


  const lagosDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const todayInLagos = lagosDateFormatter.format(now) 




  if (selectedDate !== todayInLagos) {
    console.log("=== FUTURE BOOKING - NO RESTRICTIONS ===")
    return { valid: true }
  }



  const lagosTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }))
  const slotStart = new Date(slotStartUtc)
  const minimumBookingTime = new Date(lagosTime.getTime() + 2 * 60 * 60 * 1000) 

 

  if (slotStart < minimumBookingTime) {
    const minTimeString = minimumBookingTime.toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    console.log("=== VALIDATION FAILED ===")
    return {
      valid: false,
      message: `Booking must be at least 2 hours from now. Select a time after ${minTimeString} Lagos time.`,
    }
  }

  console.log("=== VALIDATION PASSED ===")
  return { valid: true }
}

function LagosTimeDisplay({ selectedDate }: { selectedDate: string }) {
  const [lagosTime, setLagosTime] = useState("")
  const [minBookingTime, setMinBookingTime] = useState("")
  const [isToday, setIsToday] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()

      const lagosDateFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })

      const todayInLagos = lagosDateFormatter.format(now)
      const isTodayBooking = selectedDate === todayInLagos

      setIsToday(isTodayBooking)

      if (isTodayBooking) {
        const lagosNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" }))
        const minBooking = new Date(lagosNow.getTime() + 2 * 60 * 60 * 1000)

        setLagosTime(
          lagosNow.toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
        )

        setMinBookingTime(
          minBooking.toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        )
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [selectedDate])


  if (!isToday) {
    return (
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-4 mt-4 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="font-semibold text-accent">Future Booking Available</div>
            <div className="text-sm text-accent/80">All time slots are available with no restrictions</div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mt-4 animate-fade-in">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-primary">Today's Booking</div>
          <div className="text-sm text-primary/80 space-y-1">
            <div>
              Current Lagos Time: <span className="font-mono font-medium">{lagosTime}</span>
            </div>
            <div>
              Earliest available: <span className="font-mono font-medium">{minBookingTime}</span> (2-hour minimum)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VendorDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const vendorId = Number.parseInt(params.id as string)
  const { toast } = useToast()

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => {

    const now = new Date()
    const lagosDateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    return lagosDateFormatter.format(now)
  })
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotType | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [showBookingPanel, setShowBookingPanel] = useState(false)


  useEffect(() => {
    async function fetchVendor() {
      try {
        const response = await api.getVendors()
        if (response.success && response.data) {
          const foundVendor = response.data.find((v) => v.id === vendorId)
          if (foundVendor) {
            setVendor(foundVendor)
          } else {
            toast({
              title: "Error",
              description: "Vendor not found",
              variant: "destructive",
            })
            navigate("/")
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load vendor details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [vendorId, navigate, toast])


  useEffect(() => {
    if (!vendor) return

    async function fetchAvailability() {
      setLoadingAvailability(true)
      try {
        const response = await api.getAvailability(vendorId, selectedDate)
        if (response.success && response.data) {
          setAvailability(response.data)
          setSelectedSlot(null) 
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to load availability",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Network error loading availability",
          variant: "destructive",
        })
      } finally {
        setLoadingAvailability(false)
      }
    }

    fetchAvailability()
  }, [vendor, vendorId, selectedDate, toast])

  const handleSlotSelect = (slot: TimeSlotType) => {
   
    const validation = validateBookingTime(slot.startUtc, selectedDate)

    if (!validation.valid) {
      toast({
        title: "Invalid Time Selection",
        description: validation.message,
        variant: "destructive",
      })
      return
    }

    setSelectedSlot(slot)
    setShowBookingPanel(true)
  }

  const handleBookingComplete = (booking: Booking) => {
 
    if (vendor) {
      api.getAvailability(vendorId, selectedDate).then((response) => {
        if (response.success && response.data) {
          setAvailability(response.data)
        }
      })
    }


    setShowBookingPanel(false)
    setSelectedSlot(null)
  }

  const refreshAvailability = async () => {
    if (!vendor) return

    setLoadingAvailability(true)
    try {
      const response = await api.getAvailability(vendorId, selectedDate)
      if (response.success && response.data) {
        setAvailability(response.data)
        setSelectedSlot(null)
        toast({
          title: "Refreshed",
          description: "Availability updated",
          variant: "success",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh availability",
        variant: "destructive",
      })
    } finally {
      setLoadingAvailability(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient">
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground">Loading vendor details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen hero-gradient">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Vendor Not Found</h2>
              <p className="text-muted-foreground">The vendor you're looking for doesn't exist or has been removed.</p>
            </div>
            <Link to="/">
              <Button className="h-12 px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vendors
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen hero-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8 animate-fade-in">
          <Link to="/">
            <Button variant="outline" size="sm" className="h-10 px-4 glass bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
            
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-foreground text-balance">{vendor.name}</h1>
            <div className="flex items-center text-muted-foreground mt-2 space-x-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">{vendor.timezone}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-accent" />
                <span className="text-sm">Professional Service</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8 animate-slide-up">
            {/* Date Selection */}
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Select Date</h3>
                      <p className="text-sm text-muted-foreground">Choose your preferred appointment date</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshAvailability}
                    disabled={loadingAvailability}
                    className="h-10 px-4 bg-transparent"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAvailability ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-4 border border-border rounded-xl bg-background/50 backdrop-blur-sm text-base focus-ring"
                />

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    All times displayed in <span className="font-medium text-foreground">Africa/Lagos</span> timezone
                  </p>
                </div>

                {/* FIXED: Pass selectedDate as prop */}
                <LagosTimeDisplay selectedDate={selectedDate} />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl">Available Times</CardTitle>
                <p className="text-muted-foreground">{formatDate(selectedDate)} • 30-minute slots</p>
              </CardHeader>
              <CardContent>
                {loadingAvailability ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading available times...</p>
                    </div>
                  </div>
                ) : availability && availability.slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availability.slots.map((slot, index) => {
                  
                      const validation = validateBookingTime(slot.startUtc, selectedDate)
                      const isDisabled = !validation.valid

                      return (
                        <div
                          key={slot.startUtc}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <TimeSlot
                            slot={slot}
                            isSelected={selectedSlot?.startUtc === slot.startUtc}
                            isAvailable={true} 
                            disabled={isDisabled} 
                            onClick={() => handleSlotSelect(slot)}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">No Available Slots</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        No time slots are available for this date. Please select another day or try refreshing.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-8">
              {showBookingPanel && selectedSlot && vendor ? (
                <div className="animate-slide-up">
                  <BookingPanel
                    vendor={vendor}
                    selectedSlot={selectedSlot}
                    selectedDate={selectedDate}
                    onClose={() => {
                      setShowBookingPanel(false)
                      setSelectedSlot(null)
                    }}
                    onBookingComplete={handleBookingComplete}
                  />
                </div>
              ) : (
                <Card className="glass">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8 text-primary opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Select a Time Slot</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Choose an available time slot from the calendar to continue with your booking
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}