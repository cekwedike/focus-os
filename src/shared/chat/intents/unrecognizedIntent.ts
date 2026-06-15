import { unrecognized } from '../responseTemplates'
import type { IntentMatch } from '../routerContext'

export function buildUnrecognizedMatch(message?: string): IntentMatch {
  return {
    intent: 'unrecognized',
    ambiguousMessage: message ?? unrecognized(),
    requiresIpc: false,
  }
}
