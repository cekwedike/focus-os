import type { IntentMatch } from '../routerContext'

export function matchTriageInboxIntent(input: string): IntentMatch | null {
  const normalized = input.trim().toLowerCase()
  if (
    /(triage|check|review).{0,20}(inbox|email|emails|gmail)/i.test(normalized) ||
    /(actionable|suggested).{0,15}(email|task)/i.test(normalized)
  ) {
    return {
      intent: 'triage_inbox',
      requiresIpc: true,
      extracted: {},
    }
  }
  return null
}

export function matchAcceptEmailTaskIntent(input: string): IntentMatch | null {
  const match = input.trim().match(/accept (?:email )?task (\d+)/i)
  if (!match) {
    return null
  }
  return {
    intent: 'accept_email_task',
    requiresIpc: true,
    extracted: { emailId: Number(match[1]) },
  }
}
