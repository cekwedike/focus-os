import type { IntentMatch } from '../routerContext'

export function buildUnrecognizedMatch(message?: string): IntentMatch {
  if (message) {
    return {
      intent: 'unrecognized',
      ambiguousMessage: message,
      requiresIpc: false,
    }
  }

  return {
    intent: 'unrecognized',
    requiresIpc: false,
  }
}
