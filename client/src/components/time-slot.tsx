import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"
import type { TimeSlot as TimeSlotType } from "../lib/api"

interface TimeSlotProps {
  slot: TimeSlotType
  isSelected: boolean
  isAvailable: boolean
  onClick: () => void
  disabled?: boolean
}

export function TimeSlot({ slot, isSelected, isAvailable, onClick, disabled = false }: TimeSlotProps) {

  if (disabled) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className="h-12 bg-red-50 border-red-200 text-red-400 cursor-not-allowed relative"
        title="This time slot is too soon (2-hour minimum required)"
      >
        <div className="flex flex-col items-center">
          <span>{slot.startLagos}</span>
          <span className="text-xs">Too soon</span>
        </div>
        {/* Red indicator dot */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      </Button>
    )
  }

  if (!isAvailable) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className="h-12 text-muted-foreground bg-muted cursor-not-allowed"
        title="This time slot is not available"
      >
        {slot.startLagos}
      </Button>
    )
  }


  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      onClick={onClick}
      className={cn("h-12 transition-all", isSelected && "ring-2 ring-primary ring-offset-2")}
      title={`Select ${slot.startLagos} time slot`}
    >
      {slot.startLagos}
    </Button>
  )
}