import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyInsightSnapshot } from '../../src/shared/types/insights'
import type { AppSettings } from '../../src/shared/types/settings'

vi.mock('../../src/main/services/secretsService', () => ({
  isOpenRouterKeyConfigured: vi.fn(),
  getOpenRouterApiKeyForMainProcess: vi.fn(),
}))

import { generateInsightContent } from '../../src/main/services/aiService'
import {
  getOpenRouterApiKeyForMainProcess,
  isOpenRouterKeyConfigured,
} from '../../src/main/services/secretsService'

const baseSettings: AppSettings = {
  openrouterModel: 'openai/gpt-4o-mini',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3',
  defaultStalenessHours: 48,
  microBreakIntervalMinutes: 90,
  minViableBlockMinutes: 15,
  defaultBufferPercent: 10,
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
  },
  themeAccent: '#2DD4A0',
  onboardingComplete: false,
}

const snapshot: DailyInsightSnapshot = {
  scheduleDate: '2026-06-14',
  generatedAt: '2026-06-14T08:00:00.000Z',
  blocks: [],
  tasksByClient: [],
  staleClients: [],
  faith: {
    currentStreak: 1,
    longestStreak: 1,
    todayEntryLogged: false,
    todayBibleReference: null,
  },
  yesterdaySummary: null,
  bumpedTasks: [],
}

function mockFetch(handler: (url: string) => Response | Promise<Response>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => handler(String(input)))
  )
}

describe('generateInsightContent', () => {
  beforeEach(() => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(false)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('uses OpenRouter when it succeeds', async () => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(true)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue('test-key')

    mockFetch((url) => {
      if (url.includes('openrouter.ai')) {
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Morning briefing from OpenRouter' } }],
          }),
          { status: 200 }
        )
      }
      return new Response('unexpected', { status: 500 })
    })

    const result = await generateInsightContent(snapshot, baseSettings)

    expect(result.source).toBe('openrouter')
    expect(result.contentMarkdown).toContain('OpenRouter')
  })

  it('falls back to Ollama when OpenRouter fails', async () => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(true)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue('test-key')

    mockFetch((url) => {
      if (url.includes('openrouter.ai')) {
        return new Response('rate limited', { status: 429 })
      }
      if (url.includes('localhost:11434')) {
        return new Response(
          JSON.stringify({
            message: { content: 'Morning briefing from Ollama' },
          }),
          { status: 200 }
        )
      }
      return new Response('unexpected', { status: 500 })
    })

    const result = await generateInsightContent(snapshot, baseSettings)

    expect(result.source).toBe('ollama')
    expect(result.contentMarkdown).toContain('Ollama')
  })

  it('returns graceful none result when both providers fail', async () => {
    vi.mocked(isOpenRouterKeyConfigured).mockReturnValue(true)
    vi.mocked(getOpenRouterApiKeyForMainProcess).mockReturnValue('test-key')

    mockFetch(() => new Response('failed', { status: 500 }))

    const result = await generateInsightContent(snapshot, baseSettings)

    expect(result.source).toBe('none')
    expect(result.contentMarkdown).toContain("Today's plan")
    expect(result.errorMessage).toBeTruthy()
  })
})
