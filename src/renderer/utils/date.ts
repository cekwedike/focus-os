import { resolveDefaultTimezone } from '@shared/constants/timezones'
import { getDateStringInTimezone, getTimeHHMMInTimezone } from '@shared/utils/displayTime'

export function getTodayDateString(timeZone = resolveDefaultTimezone()): string {
  return getDateStringInTimezone(new Date(), timeZone)
}

export function getCurrentTimeHHMM(timeZone = resolveDefaultTimezone()): string {
  return getTimeHHMMInTimezone(new Date(), timeZone)
}
