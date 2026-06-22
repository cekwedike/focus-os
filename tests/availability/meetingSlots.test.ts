import { describe, expect, it } from 'vitest'
import { findMeetingSlots, detectScheduleConflicts } from '@shared/availability'
import type { CalendarEventRow } from '@shared/types/integrations'
import type { DailyScheduleRow } from '@shared/types/db'

describe('availability engine', () => {
  it('finds conflict-free meeting slots', () => {
    const slots = findMeetingSlots({
      scheduleDate: '2026-06-22',
      durationMinutes: 30,
      dayStartIso: '2026-06-22T09:00:00',
      dayEndIso: '2026-06-22T23:00:00',
      scheduleBlocks: [
        {
          id: 1,
          title: 'CXU',
          planned_start: '2026-06-22T10:00:00',
          planned_end: '2026-06-22T11:00:00',
          status: 'planned',
        } as DailyScheduleRow,
      ],
      calendarEvents: [
        {
          id: 1,
          external_id: 'evt1',
          account_id: 1,
          calendar_id: 'primary',
          title: 'Call',
          start_at: '2026-06-22T14:00:00',
          end_at: '2026-06-22T15:00:00',
          is_all_day: 0,
          attendees_json: null,
          location: null,
          synced_at: '2026-06-22T08:00:00',
        } as CalendarEventRow,
      ],
      preferredStartHour: 9,
      preferredEndHour: 17,
      maxSlots: 3,
    })

    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every((slot) => slot.startAt < slot.endAt)).toBe(true)
  })

  it('detects overlaps between schedule blocks and calendar events', () => {
    const conflicts = detectScheduleConflicts(
      [
        {
          id: 1,
          title: 'Deep work',
          planned_start: '2026-06-22T13:30:00',
          planned_end: '2026-06-22T15:30:00',
          status: 'planned',
        } as DailyScheduleRow,
      ],
      [
        {
          id: 1,
          external_id: 'evt1',
          account_id: 1,
          calendar_id: 'primary',
          title: 'Client call',
          start_at: '2026-06-22T14:00:00',
          end_at: '2026-06-22T15:00:00',
          is_all_day: 0,
          attendees_json: null,
          location: null,
          synced_at: '2026-06-22T08:00:00',
        } as CalendarEventRow,
      ]
    )

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.eventTitle).toBe('Client call')
  })
})
