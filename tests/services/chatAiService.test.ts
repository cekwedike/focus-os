import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettings } from '../../src/shared/types/settings'
import { DEFAULT_OPENROUTER_FREE_MODELS } from '../../src/shared/constants/chatAi'
import { createTestContext } from '../chat/testContext'

vi.mock('../../src/main/services/secretsService', () => ({
  isOpenRouterKeyConfigured: vi.fn(),
  getOpenRouterApiKeyForMainProcess: vi.fn(),
}))

import { resolveChatAiFallback } from '../../src/main/services/chatAiService'
import {
  getOpenRouterApiKeyForMainProcess,
  isOpenRouterKeyConfigured,
} from '../../src/main/services/secretsService'

const baseSettings: AppSettings = {
  openrouterModel: 'openai/gpt-4o-mini',
  openrouterFreeModels: [...DEFAULT_OPENROUTER_FREE_MODELS],
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3',
  voiceInputEnabled: true,
  voiceOutputEnabled: false,
  defaultStalenessHours: 48,
  microBreakIntervalMinutes: 90,
  minViableBlockMinutes: 15,
  defaultBufferPercent: 10,
  maxBufferMinutes: 60,
  doomscrollAllowanceMinutes: 5,
  timeFormat: '12h',
  weekStartsOn: 'monday',
  dateFormat: 'mdy',
  defaultSleepTime: '22:00',
  timezone: 'America/New_York',
  notifications: {
    microBreak: true,
    staleness: true,
    insightReady: true,
    clientReminder: true,
    blockReminder: true,
    assistantBriefing: true,
    preMeeting: true,
  },
  themeAccent: '#2DD4A0',
  onboardingComplete: false,
  userDisplayName: '',
  sidebarExpanded: true,
  launchAtLogin: false,
  trayCloseTipShown: false,
  googleSyncIntervalMinutes: 30,
  assistant: {
    morningEnabled: true,
    hourlyEnabled: true,
    preMeetingEnabled: true,
    morningHour: 6,
  },
  google: {
    syncIntervalMinutes: 30,
    calendarIds: ['primary'],
    gmailEnabled: true,
    calendarEnabled: true,
  },
  freelancerWizardComplete: false,
}

function mockFetch(handler: (url: string) => Response | Promise<Response>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => handler(String(input)))
  )
}

describe('resolveChatAiFallback', () => {
  beforeEach(() => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(false)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns conversational response from first free model', async () => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(true)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue('test-key')

    mockFetch((url) => {
      if (url.includes('openrouter.ai')) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    mode: 'conversational',
                    replyText: 'You have three blocks left today.',
                  }),
                },
              },
            ],
          }),
          { status: 200 }
        )
      }
      return new Response('unexpected', { status: 500 })
    })

    const result = await resolveChatAiFallback({
      payload: {
        userMessage: 'what should I focus on',
        routerContextSummary: {
          today: '2026-06-15',
          pendingPrompt: null,
          longBreakActive: false,
          activeFaithBlockId: null,
          activeBlockId: null,
          clients: [],
          todayBlocks: [],
          dueCheckInClients: [],
        },
        scheduleDate: '2026-06-15',
      },
      settings: baseSettings,
      snapshotJson: '{}',
      routerContext: createTestContext(),
    })

    expect(result.source).toBe('openrouter')
    expect(result.response.mode).toBe('conversational')
    if (result.response.mode === 'conversational') {
      expect(result.response.replyText).toContain('three blocks')
    }
  })

  it('returns unavailable when all providers fail', async () => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(true)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue('test-key')

    mockFetch(() => new Response('failed', { status: 500 }))

    const result = await resolveChatAiFallback({
      payload: {
        userMessage: 'hello there',
        routerContextSummary: {
          today: '2026-06-15',
          pendingPrompt: null,
          longBreakActive: false,
          activeFaithBlockId: null,
          activeBlockId: null,
          clients: [],
          todayBlocks: [],
          dueCheckInClients: [],
        },
        scheduleDate: '2026-06-15',
      },
      settings: baseSettings,
      snapshotJson: '{}',
      routerContext: createTestContext(),
    })

    expect(result.source).toBe('none')
    expect(result.response.mode).toBe('unavailable')
    expect(result.errorMessage).toBeTruthy()
  })

  it('validates execute intents against router context', async () => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(true)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue('test-key')

    mockFetch((url) => {
      if (url.includes('openrouter.ai')) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    mode: 'execute',
                    intent: 'end_break',
                    extracted: {},
                  }),
                },
              },
            ],
          }),
          { status: 200 }
        )
      }
      return new Response('unexpected', { status: 500 })
    })

    const result = await resolveChatAiFallback({
      payload: {
        userMessage: "I'm back",
        routerContextSummary: {
          today: '2026-06-15',
          pendingPrompt: null,
          longBreakActive: false,
          activeFaithBlockId: null,
          activeBlockId: null,
          clients: [],
          todayBlocks: [],
          dueCheckInClients: [],
        },
        scheduleDate: '2026-06-15',
      },
      settings: baseSettings,
      snapshotJson: '{}',
      routerContext: createTestContext({
        conversation: {
          pendingPrompt: null,
          pendingTaskDraft: null,
          longBreakActive: false,
          activeFaithBlockId: null,
        },
      }),
    })

    expect(result.response.mode).toBe('unavailable')
  })
})
