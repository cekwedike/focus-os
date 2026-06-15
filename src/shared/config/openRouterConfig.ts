import type { AppSettings } from '@shared/types/settings'

export function resolveOpenRouterModel(settings: AppSettings): string {
  const fromSettings = settings.openrouterModel.trim()
  if (fromSettings) {
    return fromSettings
  }

  const fromEnv = process.env.OPENROUTER_MODEL?.trim()
  return fromEnv ?? ''
}
