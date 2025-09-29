import moment from "moment-timezone"

const LAGOS_TZ = "Africa/Lagos"

export class TimezoneUtils {
  /**
   * Convert a date string in Lagos timezone to UTC Date object
   */
  static lagosToUtc(dateStr: string, timeStr: string): Date {
    const lagosDateTime = `${dateStr} ${timeStr}`
    return moment.tz(lagosDateTime, "YYYY-MM-DD HH:mm", LAGOS_TZ).utc().toDate()
  }

  /**
   * Convert UTC Date to Lagos timezone string
   */
  static utcToLagos(utcDate: Date): string {
    return moment.utc(utcDate).tz(LAGOS_TZ).format("HH:mm")
  }

  /**
   * Get current time in Lagos
   */
  static nowInLagos(): moment.Moment {
    return moment().tz(LAGOS_TZ)
  }

  /**
   * Check if booking is for today in Lagos and enforce 2-hour buffer
   */
  static validateBookingTime(startTimeUtc: Date): { valid: boolean; error?: string } {
    const nowLagos = this.nowInLagos()
    const startTimeLagos = moment.utc(startTimeUtc).tz(LAGOS_TZ)

    // Check if booking is for today
    if (startTimeLagos.format("YYYY-MM-DD") === nowLagos.format("YYYY-MM-DD")) {
      const twoHoursFromNow = nowLagos.clone().add(2, "hours")

      if (startTimeLagos.isBefore(twoHoursFromNow)) {
        return {
          valid: false,
          error: `Booking must be at least 2 hours from now. Current time: ${nowLagos.format("HH:mm")}, minimum booking time: ${twoHoursFromNow.format("HH:mm")}`,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Generate 30-minute slots for a date in Lagos timezone
   */
  static generateDaySlots(dateStr: string): Date[] {
    const slots: Date[] = []

    // Generate slots from 09:00 to 17:00 (30-minute intervals)
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const utcDate = this.lagosToUtc(dateStr, timeStr)
        slots.push(utcDate)
      }
    }

    return slots
  }
}
