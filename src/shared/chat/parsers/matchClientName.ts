export interface NamedClient {
  id: number
  name: string
}

export type ClientMatchOutcome =
  | { status: 'matched'; client: NamedClient }
  | { status: 'ambiguous'; candidates: NamedClient[] }
  | { status: 'none' }

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function clientInitialism(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      const cleaned = word.replace(/[^\w]/g, '')
      if (/^[A-Z]{2,}$/.test(cleaned)) {
        return cleaned.toLowerCase().split('')
      }
      const first = cleaned[0]
      return first ? [first.toLowerCase()] : []
    })
    .join('')
}

function scoreClientMatch(query: string, client: NamedClient): number {
  const normalizedQuery = normalizeText(query)
  const normalizedName = normalizeText(client.name)

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return 0
  }

  if (normalizedName === normalizedQuery) {
    return 100
  }

  const words = normalizedName.split(' ').filter(Boolean)
  if (words.some((word) => word.startsWith(normalizedQuery))) {
    return 80
  }

  if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
    return 60
  }

  const initials = clientInitialism(client.name)
  if (normalizedQuery.length >= 2 && initials === normalizedQuery) {
    return 70
  }

  return 0
}

export function matchClientByName(query: string, clients: NamedClient[]): ClientMatchOutcome {
  const trimmed = query.trim()
  if (!trimmed) {
    return { status: 'none' }
  }

  const scored = clients
    .map((client) => ({ client, score: scoreClientMatch(trimmed, client) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)

  if (scored.length === 0) {
    return { status: 'none' }
  }

  const bestScore = scored[0].score
  const topMatches = scored.filter((entry) => entry.score === bestScore).map((entry) => entry.client)

  if (topMatches.length === 1) {
    return { status: 'matched', client: topMatches[0] }
  }

  return { status: 'ambiguous', candidates: topMatches }
}

export function matchClientFromForClause(input: string, clients: NamedClient[]): ClientMatchOutcome {
  const forMatch = input.match(/\bfor\s+(.+?)(?:\s*$)/i)
  if (!forMatch) {
    return { status: 'none' }
  }

  return matchClientByName(forMatch[1].trim(), clients)
}
