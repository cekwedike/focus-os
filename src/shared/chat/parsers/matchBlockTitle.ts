export interface BlockTitleCandidate {
  id: number
  title: string
  status: string
}

export type BlockMatchOutcome =
  | { status: 'matched'; block: BlockTitleCandidate }
  | { status: 'ambiguous'; candidates: BlockTitleCandidate[] }
  | { status: 'none' }

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenize(value: string): string[] {
  return normalizeTitle(value).split(' ').filter((token) => token.length > 0)
}

function overlapScore(query: string, title: string): number {
  const normalizedQuery = normalizeTitle(query)
  const normalizedTitle = normalizeTitle(title)

  if (!normalizedQuery) {
    return 0
  }

  if (normalizedQuery === normalizedTitle) {
    return 100
  }

  if (normalizedQuery.length >= 3 && normalizedTitle.includes(normalizedQuery)) {
    return 80
  }

  if (normalizedTitle.length >= 3 && normalizedQuery.includes(normalizedTitle)) {
    return 75
  }

  const queryTokens = tokenize(query)
  const titleTokens = tokenize(title)
  if (queryTokens.length === 0 || titleTokens.length === 0) {
    return 0
  }

  const matchedTokens = queryTokens.filter((token) =>
    titleTokens.some((titleToken) => titleToken.includes(token) || token.includes(titleToken))
  )
  const ratio = matchedTokens.length / queryTokens.length
  if (ratio >= 0.5) {
    return Math.round(ratio * 60)
  }

  return 0
}

export function matchBlockByTitle(
  query: string,
  blocks: BlockTitleCandidate[],
  allowedStatuses: string[]
): BlockMatchOutcome {
  const eligible = blocks.filter((block) => allowedStatuses.includes(block.status))
  const scored = eligible
    .map((block) => ({ block, score: overlapScore(query, block.title) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)

  if (scored.length === 0) {
    return { status: 'none' }
  }

  const bestScore = scored[0].score
  const topMatches = scored.filter((entry) => entry.score === bestScore).map((entry) => entry.block)

  if (topMatches.length === 1) {
    return { status: 'matched', block: topMatches[0] }
  }

  return { status: 'ambiguous', candidates: topMatches }
}
