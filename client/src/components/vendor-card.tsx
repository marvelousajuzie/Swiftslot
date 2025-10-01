import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Clock } from "lucide-react"
import type { Vendor } from "../lib/api"
import { Link } from "react-router-dom"

interface VendorCardProps {
  vendor: Vendor
}

export function VendorCard({ vendor }: VendorCardProps) {

  const initials = vendor.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-zinc-700">{vendor.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Clock className="w-4 h-4 mr-1" />
              {vendor.timezone}
            </div>
          </div>
        </div>
        <Link to={`/vendor/${vendor.id}`}>
          <Button className="w-full">See availability</Button>
        </Link>
      </CardContent>
    </Card>
  )
}