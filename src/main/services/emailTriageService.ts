import type Database from 'better-sqlite3'
import { listClients } from '../db/repositories/clientsRepository'
import {
  listUntriagedEmails,
  updateEmailTriage,
} from '../db/repositories/emailMessagesRepository'
import { getOpenRouterApiKeyForMainProcess } from './secretsService'
import { getAllSettings } from '../db/repositories/appSettingsRepository'

interface TriageResult {
  isActionable: boolean
  summary: string
  suggestedTitle?: string
  suggestedClientName?: string
  suggestedPriority?: number
  suggestedDeadline?: string
}

function matchClientByEmailOrName(
  fromAddress: string,
  subject: string,
  clients: ReturnType<typeof listClients>
): number | null {
  const haystack = `${fromAddress} ${subject}`.toLowerCase()
  for (const client of clients) {
    if (client.is_active !== 1) {
      continue
    }
    if (haystack.includes(client.name.toLowerCase())) {
      return client.id
    }
  }
  return null
}

async function triageWithAi(
  db: Database.Database,
  subject: string,
  fromAddress: string,
  snippet: string | null,
  clientNames: string[]
): Promise<TriageResult | null> {
  const apiKey = getOpenRouterApiKeyForMainProcess()
  const settings = getAllSettings(db)
  const model = settings.openrouterModel || settings.openrouterFreeModels[0]

  if (!apiKey || !model) {
    return null
  }

  const prompt = `Classify this email for a freelancer assistant. Clients: ${clientNames.join(', ') || 'none'}.
Return JSON only: {"isActionable":boolean,"summary":"one sentence","suggestedTitle":"task title or empty","suggestedClientName":"name or empty","suggestedPriority":1-5,"suggestedDeadline":"YYYY-MM-DD or empty"}
Email from: ${fromAddress}
Subject: ${subject}
Snippet: ${snippet ?? ''}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    return null
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return null
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as TriageResult
    return parsed
  } catch {
    return null
  }
}

function heuristicTriage(
  subject: string,
  fromAddress: string,
  snippet: string | null,
  clients: ReturnType<typeof listClients>
): TriageResult {
  const text = `${subject} ${snippet ?? ''}`.toLowerCase()
  const actionableKeywords = [
    'action required',
    'please review',
    'deadline',
    'urgent',
    'asap',
    'invoice',
    'proposal',
    'follow up',
    'follow-up',
    '?',
  ]
  const isActionable = actionableKeywords.some((keyword) => text.includes(keyword))
  const clientId = matchClientByEmailOrName(fromAddress, subject, clients)
  const clientName = clientId
    ? (clients.find((client) => client.id === clientId)?.name ?? '')
    : ''

  return {
    isActionable,
    summary: isActionable
      ? `May need a response: ${subject}`
      : `FYI: ${subject}`,
    suggestedTitle: isActionable ? subject.replace(/^(re:|fwd:)\s*/i, '').slice(0, 120) : '',
    suggestedClientName: clientName,
    suggestedPriority: isActionable ? 2 : 4,
    suggestedDeadline: '',
  }
}

export async function triageUntriagedEmails(db: Database.Database, accountId: number): Promise<number> {
  const emails = listUntriagedEmails(db, accountId)
  const clients = listClients(db)
  const clientNames = clients.filter((c) => c.is_active === 1).map((c) => c.name)
  let triaged = 0

  for (const email of emails) {
    const aiResult = await triageWithAi(
      db,
      email.subject,
      email.from_address,
      email.snippet,
      clientNames
    )
    const result =
      aiResult ??
      heuristicTriage(email.subject, email.from_address, email.snippet, clients)

    const suggestedClientId =
      result.suggestedClientName
        ? clients.find(
            (client) =>
              client.name.toLowerCase() === result.suggestedClientName?.toLowerCase()
          )?.id ?? matchClientByEmailOrName(email.from_address, email.subject, clients)
        : matchClientByEmailOrName(email.from_address, email.subject, clients)

    updateEmailTriage(db, email.id, {
      isActionable: result.isActionable,
      triageSummary: result.summary,
      suggestedClientId,
      suggestedPriority: result.suggestedPriority ?? (result.isActionable ? 2 : 4),
      suggestedDeadline: result.suggestedDeadline || null,
    })
    triaged += 1
  }

  return triaged
}
