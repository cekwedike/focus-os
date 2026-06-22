export interface PriorityClientInput {
  id: number
  sortOrder: number
  fixedBlockEnabled: boolean
}

/**
 * Maps drag-rank (sort_order, lower = higher priority) to weight_percent for flexible clients.
 * Rank 1 among n clients gets n points, rank n gets 1 point, normalized to 100%.
 */
export function weightsFromPriorityRank(
  clients: PriorityClientInput[]
): Map<number, number> {
  const flexible = clients
    .filter((client) => !client.fixedBlockEnabled)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id)

  const result = new Map<number, number>()
  const n = flexible.length
  if (n === 0) {
    return result
  }

  const pointSum = (n * (n + 1)) / 2
  flexible.forEach((client, index) => {
    const points = n - index
    const percent = Math.round((points / pointSum) * 1000) / 10
    result.set(client.id, percent)
  })

  return result
}

export function rebalanceClientWeights<T extends PriorityClientInput & { weight_percent: number }>(
  clients: T[]
): T[] {
  const weights = weightsFromPriorityRank(clients)
  return clients.map((client) => {
    if (client.fixedBlockEnabled) {
      return { ...client, weight_percent: 0 }
    }
    const next = weights.get(client.id)
    return next === undefined ? client : { ...client, weight_percent: next }
  })
}
