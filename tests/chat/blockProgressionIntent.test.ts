import { describe, expect, it } from 'vitest'
import { matchExtendBlockIntent, matchSkipBlockIntent } from '../../src/shared/chat/intents/blockProgressionIntent'
import { matchCompleteBlockIntent } from '../../src/shared/chat/intents/blockActionIntent'
import { createTestContext } from './testContext'

describe('block progression intents', () => {
  const context = createTestContext({
    todayBlocks: [
      {
        id: 1,
        title: 'Lunch',
        status: 'active',
        block_type: 'protected',
        protected_subtype: 'meal',
      },
      {
        id: 2,
        title: 'Client work',
        status: 'planned',
        block_type: 'weighted_client',
        protected_subtype: null,
      },
    ],
    activeBlockId: 1,
  })

  it('matches extend by 5 on active block', () => {
    const match = matchExtendBlockIntent('give me 5 more minutes', context)
    expect(match?.intent).toBe('extend_block')
    expect(match?.extracted).toEqual({ blockId: 1, title: 'Lunch' })
  })

  it('matches skip this on active block', () => {
    const match = matchSkipBlockIntent('skip this', context)
    expect(match?.intent).toBe('skip_block')
  })

  it('matches early completion phrasing', () => {
    const match = matchCompleteBlockIntent("I'm done early", context)
    expect(match?.intent).toBe('complete_block')
    expect(match?.extracted).toMatchObject({ blockId: 1, early: true })
  })
})
