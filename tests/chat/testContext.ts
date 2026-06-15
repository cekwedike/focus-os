import type { RouterContext } from '../../src/shared/chat/routerContext'
import { createDefaultConversationState } from '../../src/shared/chat/routerContext'

export function createTestContext(overrides: Partial<RouterContext> = {}): RouterContext {
  return {
    today: '2026-06-15',
    conversation: createDefaultConversationState(),
    clients: [
      { id: 1, name: 'Acme Corp' },
      { id: 2, name: 'Beta Design' },
      { id: 3, name: 'CX University' },
    ],
    todayBlocks: [
      {
        id: 10,
        title: 'Morning Focus Block',
        status: 'planned',
        block_type: 'weighted_client',
        protected_subtype: null,
        planned_start: '2026-06-15T09:00:00.000Z',
      },
      {
        id: 11,
        title: 'Faith Time',
        status: 'active',
        block_type: 'protected',
        protected_subtype: 'faith',
        planned_start: '2026-06-15T07:00:00.000Z',
      },
      {
        id: 12,
        title: 'Client Work Acme',
        status: 'active',
        block_type: 'fixed_client',
        protected_subtype: null,
      },
    ],
    activeBlockId: 12,
    unassignedClientId: 99,
    defaultSleepTime: '22:00',
    defaultCapacityMinutes: 480,
    defaultBufferPercent: 10,
    nowIso: '2026-06-15T14:30:00.000Z',
    dueCheckInClients: [],
    ...overrides,
  }
}
