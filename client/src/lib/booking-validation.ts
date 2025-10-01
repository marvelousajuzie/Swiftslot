// lib/booking-validation.ts
// Create this file or add to your utils

/**
 * Validates if a booking slot meets the 2-hour minimum requirement
 * Only applies to TODAY's bookings in Lagos timezone
 * Future dates have NO restrictions
 */
export const validateBookingTime = (
  slotStartUtc: string, 
  selectedDate: string
): { valid: boolean; message?: string } => {
  
  // Get current time in Lagos timezone using proper method
  const nowUtc = new Date();
  
  // Get Lagos date string in YYYY-MM-DD format
  const lagosDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const todayInLagos = lagosDateFormatter.format(nowUtc); // Returns "2025-09-29" format
  
  console.group('🔍 BOOKING VALIDATION');
  console.log('Selected date:', selectedDate);
  console.log('Today in Lagos:', todayInLagos);
  console.log('Is today?', selectedDate === todayInLagos);
  
  // If not today, all slots are valid (no 2-hour restriction)
  if (selectedDate !== todayInLagos) {
    console.log('✅ FUTURE BOOKING - No time restrictions');
    console.groupEnd();
    return { valid: true };
  }
  
  // For TODAY's bookings, apply 2-hour rule
  console.log('📅 TODAY\'S BOOKING - Checking 2-hour rule...');
  
  // Get current Lagos time for comparison
  const lagosTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const lagosTimeParts = lagosTimeFormatter.formatToParts(nowUtc);
  const lagosTimeObj: Record<string, string> = {};
  lagosTimeParts.forEach(part => {
    if (part.type !== 'literal') {
      lagosTimeObj[part.type] = part.value;
    }
  });
  
  // Create Date object for current Lagos time
  const lagosNow = new Date(
    `${lagosTimeObj.year}-${lagosTimeObj.month}-${lagosTimeObj.day}T${lagosTimeObj.hour}:${lagosTimeObj.minute}:${lagosTimeObj.second}`
  );
  
  const slotStart = new Date(slotStartUtc);
  const minimumBookingTime = new Date(lagosNow.getTime() + 2 * 60 * 60 * 1000); // +2 hours
  
  console.log('Current Lagos time:', lagosNow.toISOString());
  console.log('Slot start (UTC):', slotStart.toISOString());
  console.log('Minimum required:', minimumBookingTime.toISOString());
  console.log('Is slot valid?', slotStart >= minimumBookingTime);
  
  if (slotStart < minimumBookingTime) {
    const minTimeString = minimumBookingTime.toLocaleTimeString('en-US', { 
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    console.log('❌ INVALID - Slot is too soon');
    console.groupEnd();
    
    return {
      valid: false,
      message: `Booking must be at least 2 hours from now. Select a time after ${minTimeString} Lagos time.`
    };
  }
  
  console.log('✅ VALID - Slot meets 2-hour requirement');
  console.groupEnd();
  
  return { valid: true };
};