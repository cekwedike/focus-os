import { describe, expect, it } from 'vitest'
import {
  faithStreakSummary,
  menuList,
  replanSummaryText,
  taskAdded,
  unrecognized,
  wakeTimePrompt,
} from '../../src/shared/chat/responseTemplates'
import { CHAT_SCREEN_LINKS } from '../../src/shared/chat/routerContext'

describe('responseTemplates', () => {
  it('builds wake time prompt', () => {
    expect(wakeTimePrompt()).toContain('wake up')
  })

  it('builds task added message', () => {
    expect(taskAdded('Write docs', 'Acme Corp')).toContain('Write docs')
    expect(taskAdded('Write docs', 'Acme Corp')).toContain('Acme Corp')
  })

  it('builds menu list', () => {
    const text = menuList(CHAT_SCREEN_LINKS)
    expect(text).toContain('Dashboard')
    expect(text).toContain('/settings')
  })

  it('builds streak summary', () => {
    expect(faithStreakSummary(3, 10)).toContain('3 day')
    expect(faithStreakSummary(3, 10)).toContain('10 day')
  })

  it('builds replan summary text', () => {
    const text = replanSummaryText({
      returnTime: '2026-06-15T15:00:00.000Z',
      longBreakDurationMinutes: 45,
      blocksRemoved: [],
      blocksCompressed: [{ blockId: '1', beforeMinutes: 60, afterMinutes: 45 }],
      protectedBlocksUnchanged: 3,
      bumpedTaskIds: [1],
      message: 'Afternoon compressed after break.',
    })
    expect(text).toContain('Afternoon compressed')
    expect(text).toContain('45 minutes')
  })

  it('builds unrecognized message with capability list', () => {
    expect(unrecognized()).toContain("didn't quite catch that")
    expect(unrecognized()).toContain('wake time')
  })
})
