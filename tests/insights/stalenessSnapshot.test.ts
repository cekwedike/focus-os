import { describe, expect, it } from 'vitest'
import { listStaleClients } from '../../src/shared/insights/stalenessSnapshot'
import type { ClientProjectRow } from '../../src/shared/types/db'

function client(partial: Partial<ClientProjectRow> & Pick<ClientProjectRow, 'id' | 'name'>): ClientProjectRow {
  return {
    color: '#2DD4A0',
    weight_percent: 25,
    is_active: 1,
    fixed_block_enabled: 0,
    fixed_block_start: null,
    fixed_block_duration_minutes: null,
    last_touched_at: '2026-06-13T10:00:00.000Z',
    staleness_threshold_hours: null,
    reminder_enabled: 0,
    reminder_interval_minutes: null,
    reminder_label: null,
    sort_order: 0,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...partial,
  }
}

describe('listStaleClients', () => {
  const now = new Date('2026-06-14T12:00:00.000Z').getTime()

  it('returns no stale clients when all were touched recently', () => {
    const stale = listStaleClients(
      [client({ id: 1, name: 'Acme', last_touched_at: '2026-06-14T08:00:00.000Z' })],
      { defaultStalenessHours: 48 },
      now
    )

    expect(stale).toEqual([])
  })

  it('flags clients beyond the threshold', () => {
    const stale = listStaleClients(
      [client({ id: 1, name: 'Acme', last_touched_at: '2026-06-10T08:00:00.000Z' })],
      { defaultStalenessHours: 48 },
      now
    )

    expect(stale).toHaveLength(1)
    expect(stale[0]?.clientName).toBe('Acme')
  })

  it('flags clients with no last touch as stale', () => {
    const stale = listStaleClients(
      [client({ id: 1, name: 'Acme', last_touched_at: null })],
      { defaultStalenessHours: 48 },
      now
    )

    expect(stale[0]?.hoursSinceTouch).toBe(49)
  })

  it('ignores inactive and system clients', () => {
    const stale = listStaleClients(
      [
        client({ id: 1, name: '__unassigned__', last_touched_at: null }),
        client({ id: 2, name: 'Inactive', is_active: 0, last_touched_at: null }),
      ],
      { defaultStalenessHours: 48 },
      now
    )

    expect(stale).toEqual([])
  })
})
