import { describe, expect, it } from 'vitest'
import { defaultSkippableForBlockType, isBlockSkippable } from '../../src/shared/schedule/blockSkippable'
import type { ProtectedBlockRow } from '../../src/shared/types/db'

const templates = [
  {
    id: 1,
    block_type: 'meal',
    label: 'Lunch',
    duration_minutes: 25,
    anchor_type: 'fixed_time',
    anchor_value: '12:30',
    sort_order: 0,
    is_enabled: 1,
    skippable: 1,
    created_at: '',
    updated_at: '',
  },
  {
    id: 2,
    block_type: 'faith',
    label: 'Faith and prayer',
    duration_minutes: 25,
    anchor_type: 'wake_offset',
    anchor_value: '45',
    sort_order: 1,
    is_enabled: 1,
    skippable: 0,
    created_at: '',
    updated_at: '',
  },
] as ProtectedBlockRow[]

describe('blockSkippable', () => {
  it('defaults meal and micro_break to skippable', () => {
    expect(defaultSkippableForBlockType('meal')).toBe(true)
    expect(defaultSkippableForBlockType('micro_break')).toBe(true)
    expect(defaultSkippableForBlockType('faith')).toBe(false)
  })

  it('treats client blocks as skippable', () => {
    expect(
      isBlockSkippable(
        {
          block_type: 'weighted_client',
          protected_subtype: null,
        },
        templates
      )
    ).toBe(true)
  })

  it('uses protected template skippable flag', () => {
    expect(
      isBlockSkippable(
        {
          block_type: 'protected',
          protected_subtype: 'meal',
        },
        templates
      )
    ).toBe(true)

    expect(
      isBlockSkippable(
        {
          block_type: 'protected',
          protected_subtype: 'faith',
        },
        templates
      )
    ).toBe(false)
  })

  it('does not allow skipping buffer blocks', () => {
    expect(
      isBlockSkippable(
        {
          block_type: 'buffer',
          protected_subtype: null,
        },
        templates
      )
    ).toBe(false)
  })
})
