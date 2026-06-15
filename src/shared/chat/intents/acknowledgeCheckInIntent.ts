import { matchClientByName } from '../parsers/matchClientName'
import { ambiguousClient } from '../responseTemplates'
import type { AcknowledgeCheckInExtracted, IntentMatch, RouterContext } from '../routerContext'

const ACKNOWLEDGE_PATTERNS = [
  /^done\s+with\s+(.+?)\s+check(?:\s*[- ]?in)?\s*$/i,
  /^checked\s+(.+?)(?:\s+inbox)?\s*$/i,
  /^mark\s+(.+?)\s+check(?:\s*[- ]?in)?\s+(?:done|complete)\s*$/i,
]

export function matchAcknowledgeCheckInIntent(
  input: string,
  context: RouterContext
): IntentMatch | null {
  const trimmed = input.trim()
  let clientPhrase: string | null = null

  for (const pattern of ACKNOWLEDGE_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      clientPhrase = match[1].trim()
      break
    }
  }

  if (!clientPhrase) {
    return null
  }

  const dueClients = context.dueCheckInClients
  if (dueClients.length === 0) {
    return {
      intent: 'unrecognized',
      ambiguousMessage:
        'No client check-ins are due right now. You can acknowledge a check-in once its reminder appears.',
      requiresIpc: false,
    }
  }

  const outcome = matchClientByName(clientPhrase, dueClients)
  if (outcome.status === 'none') {
    return {
      intent: 'unrecognized',
      ambiguousMessage: `I could not match "${clientPhrase}" to a client with a due check-in.`,
      requiresIpc: false,
    }
  }

  if (outcome.status === 'ambiguous') {
    return {
      intent: 'unrecognized',
      ambiguousMessage: ambiguousClient(outcome.candidates.map((client) => client.name)),
      requiresIpc: false,
    }
  }

  const extracted: AcknowledgeCheckInExtracted = {
    clientId: outcome.client.id,
    clientName: outcome.client.name,
  }

  return {
    intent: 'acknowledge_check_in',
    extracted,
    requiresIpc: true,
  }
}
