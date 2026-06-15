import { describe, expect, it } from 'vitest'
import { matchAcknowledgeCheckInIntent } from '../../src/shared/chat/intents/acknowledgeCheckInIntent'
import { createDefaultConversationState } from '../../src/shared/chat/routerContext'

const baseContext = {
  today: '2026-06-14',
  conversation: createDefaultConversationState(),
  clients: [
    { id: 1, name: 'PLNITUDE' },
    { id: 2, name: 'Acme Corp' },
  ],
  todayBlocks: [],
  activeBlockId: null,
  unassignedClientId: 99,
  defaultSleepTime: '23:00',
  defaultCapacityMinutes: 480,
  defaultBufferPercent: 10,
  maxBufferMinutes: 60,
  nowIso: '2026-06-14T12:00:00.000Z',
  dueCheckInClients: [{ id: 1, name: 'PLNITUDE' }],
}

describe('matchAcknowledgeCheckInIntent', () => {
  it('matches done with client check phrasing', () => {
    const match = matchAcknowledgeCheckInIntent('done with PLNITUDE check', baseContext)
    expect(match?.intent).toBe('acknowledge_check_in')
    expect(match?.extracted).toEqual({ clientId: 1, clientName: 'PLNITUDE' })
  })

  it('matches checked inbox phrasing', () => {
    const match = matchAcknowledgeCheckInIntent('checked PLNITUDE inbox', baseContext)
    expect(match?.intent).toBe('acknowledge_check_in')
  })

  it('does not acknowledge clients that are not due', () => {
    const match = matchAcknowledgeCheckInIntent('done with Acme Corp check', baseContext)
    expect(match?.intent).toBe('unrecognized')
  })

  it('flags ambiguity between similarly named due clients', () => {
    const match = matchAcknowledgeCheckInIntent('done with Acme check', {
      ...baseContext,
      dueCheckInClients: [
        { id: 2, name: 'Acme Corp' },
        { id: 3, name: 'Acme Studio' },
      ],
    })
    expect(match?.intent).toBe('unrecognized')
    expect(match?.ambiguousMessage).toContain('Acme')
  })
})
