import { afterEach, describe, expect, it } from 'vitest'
import { resolveOpenRouterModel } from '../../src/shared/config/openRouterConfig'
import type { AppSettings } from '../../src/shared/types/settings'

const baseSettings = {
  openrouterModel: '',
} as AppSettings

describe('resolveOpenRouterModel', () => {
  afterEach(() => {
    delete process.env.OPENROUTER_MODEL
  })

  it('prefers the saved settings model', () => {
    expect(
      resolveOpenRouterModel({
        ...baseSettings,
        openrouterModel: 'anthropic/claude-3.5-sonnet',
      })
    ).toBe('anthropic/claude-3.5-sonnet')
  })

  it('falls back to OPENROUTER_MODEL from the environment', () => {
    process.env.OPENROUTER_MODEL = 'qwen/qwen3-next-80b-a3b-instruct:free'
    expect(resolveOpenRouterModel(baseSettings)).toBe('qwen/qwen3-next-80b-a3b-instruct:free')
  })
})
