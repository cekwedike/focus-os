import type { DateFormatStyle, TimeFormat } from '@shared/types/settings'

export interface ParsedHHMM {
  hours24: number
  minutes: number
}

export function parseHHMM(hhmm: string): ParsedHHMM {
  const [hoursPart, minutesPart] = hhmm.split(':')
  const hours24 = Number(hoursPart)
  const minutes = Number(minutesPart)

  if (Number.isNaN(hours24) || Number.isNaN(minutes)) {
    return { hours24: 0, minutes: 0 }
  }

  return {
    hours24: Math.min(23, Math.max(0, hours24)),
    minutes: Math.min(59, Math.max(0, minutes)),
  }
}

export function toHHMM(hours24: number, minutes: number): string {
  return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function to12HourParts(hours24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = hours24 >= 12 ? 'PM' : 'AM'
  let hour12 = hours24 % 12
  if (hour12 === 0) {
    hour12 = 12
  }
  return { hour12, period }
}

export function from12HourParts(hour12: number, minutes: number, period: 'AM' | 'PM'): string {
  let hours24 = hour12 % 12
  if (period === 'PM') {
    hours24 += 12
  }
  return toHHMM(hours24, minutes)
}

export function formatHHMM(hhmm: string, timeFormat: TimeFormat): string {
  if (!hhmm) {
    return ''
  }

  const { hours24, minutes } = parseHHMM(hhmm)
  if (timeFormat === '24h') {
    return toHHMM(hours24, minutes)
  }

  const { hour12, period } = to12HourParts(hours24)
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

export function formatClockTime(
  date: Date,
  timeFormat: TimeFormat,
  showSeconds = true,
  timeZone?: string
): string {
  if (timeZone) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: timeFormat === '24h' ? '2-digit' : 'numeric',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: timeFormat === '12h',
    }).format(date)
  }

  if (timeFormat === '24h') {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    const base = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    return showSeconds ? `${base}:${String(seconds).padStart(2, '0')}` : base
  }

  const { hour12, period } = to12HourParts(date.getHours())
  const minutes = date.getMinutes()
  const base = `${hour12}:${String(minutes).padStart(2, '0')}`
  if (!showSeconds) {
    return `${base} ${period}`
  }

  const seconds = date.getSeconds()
  return `${base}:${String(seconds).padStart(2, '0')} ${period}`
}

export function formatDateLabel(
  date: Date,
  dateFormat: DateFormatStyle,
  timeZone?: string
): string {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)

    const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
    const month = parts.find((part) => part.type === 'month')?.value ?? '01'
    const day = parts.find((part) => part.type === 'day')?.value ?? '01'

    if (dateFormat === 'dmy') {
      return `${day}/${month}/${year}`
    }
    if (dateFormat === 'ymd') {
      return `${year}-${month}-${day}`
    }
    return `${month}/${day}/${year}`
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const pad = (value: number): string => String(value).padStart(2, '0')

  if (dateFormat === 'dmy') {
    return `${pad(day)}/${pad(month)}/${year}`
  }
  if (dateFormat === 'ymd') {
    return `${year}-${pad(month)}-${pad(day)}`
  }
  return `${pad(month)}/${pad(day)}/${year}`
}

export function isValidHHMM(value: string): boolean {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  return Boolean(match)
}

function readDatePartsInTimezone(
  date: Date,
  timeZone: string
): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  return {
    year: parts.find((part) => part.type === 'year')?.value ?? '0000',
    month: parts.find((part) => part.type === 'month')?.value ?? '01',
    day: parts.find((part) => part.type === 'day')?.value ?? '01',
  }
}

export function getDateStringInTimezone(date: Date, timeZone: string): string {
  const { year, month, day } = readDatePartsInTimezone(date, timeZone)
  return `${year}-${month}-${day}`
}

export function getTimeHHMMInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

export function getWeekdayInTimezone(date: Date, timeZone: string, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: style,
  }).format(date)
}

export function getTimezoneAbbreviation(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(date)

  return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone
}

export function getTimezoneOffsetLabel(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date)

  return parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
}

/** Prefer one timezone label when abbreviation and offset repeat the same value (e.g. GMT+2 twice). */
export function resolveTimezoneDisplay(abbr: string, offset: string): string {
  const normalizedAbbr = abbr.trim()
  const normalizedOffset = offset.trim()

  if (!normalizedAbbr && !normalizedOffset) {
    return ''
  }

  if (!normalizedOffset) {
    return normalizedAbbr
  }

  if (!normalizedAbbr) {
    return normalizedOffset
  }

  if (normalizedAbbr.toUpperCase() === normalizedOffset.toUpperCase()) {
    return normalizedOffset
  }

  if (/^GMT[+-]/i.test(normalizedAbbr) && /^GMT[+-]/i.test(normalizedOffset)) {
    return normalizedOffset
  }

  return normalizedAbbr
}

export function formatMonthDayInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
  }).format(date)
}
