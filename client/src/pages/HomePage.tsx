import { VendorCard } from "../components/vendor-card"
import { api, type Vendor } from "../lib/api"
import { useEffect, useState } from "react"
import { useToast } from "../../../hooks/use-toast"
import { Search, Zap, Clock, Users } from "lucide-react"
import { Input } from "../components/ui/input"

export default function HomePage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchVendors() {
      try {
        const response = await api.getVendors()
        if (response.success && response.data) {
          setVendors(response.data)
          setFilteredVendors(response.data)
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to load vendors",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Network error loading vendors",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [toast])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVendors(vendors)
    } else {
      const filtered = vendors.filter((vendor) => 
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredVendors(filtered)
    }
  }, [searchQuery, vendors])

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-4 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                Loading SwiftSlot
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
                Swift<span className="text-primary">Slot</span>
              </h1>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen hero-gradient">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center space-y-8 mb-16 animate-fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              Professional Booking Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight text-balance">
              Swift<span className="text-primary">Slot</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
              Book your preferred vendor in 30-minute slots with our streamlined booking experience
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base focus-ring border-border/50 bg-card/50 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-foreground">30min</div>
              <div className="text-sm text-muted-foreground">Booking Slots</div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 text-accent rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-foreground">{vendors.length}+</div>
              <div className="text-sm text-muted-foreground">Available Vendors</div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-foreground">Instant</div>
              <div className="text-sm text-muted-foreground">Confirmation</div>
            </div>
          </div>
        </header>

        <main className="animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredVendors.map((vendor, index) => (
              <div 
                key={vendor.id} 
                className="animate-fade-in" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <VendorCard vendor={vendor} />
              </div>
            ))}
          </div>

          {filteredVendors.length === 0 && !loading && (
            <div className="text-center py-16 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {searchQuery ? "No vendors found" : "No vendors available"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery
                    ? `No vendors match "${searchQuery}". Try adjusting your search.`
                    : "No vendors are available at the moment. Please check back later."}
                </p>
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}