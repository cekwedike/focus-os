import type { DailyInsightSnapshot } from '@shared/types/insights'

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`
}

export function formatRawSnapshot(snapshot: DailyInsightSnapshot): string {
  const lines: string[] = []

  lines.push(`Today's plan (${snapshot.scheduleDate})`)
  lines.push(`${snapshot.blocks.length} scheduled blocks`)

  const clientBlocks = snapshot.blocks.filter(
    (block) => block.blockType === 'fixed_client' || block.blockType === 'weighted_client'
  )
  const clientNames = [...new Set(clientBlocks.map((block) => block.clientName).filter(Boolean))]
  if (clientNames.length > 0) {
    lines.push(`Clients: ${clientNames.join(', ')}`)
  }

  const activeBlocks = snapshot.blocks.filter((block) => block.status === 'active')
  const completedBlocks = snapshot.blocks.filter((block) => block.status === 'completed')
  lines.push(`Active: ${activeBlocks.length}, Completed: ${completedBlocks.length}`)

  lines.push('')
  lines.push('Tasks')
  const pendingCount = snapshot.tasksByClient.reduce(
    (total, group) => total + group.pending.length,
    0
  )
  const completedCount = snapshot.tasksByClient.reduce(
    (total, group) => total + group.completed.length,
    0
  )
  lines.push(`Pending: ${pendingCount}, Completed today: ${completedCount}`)

  lines.push('')
  lines.push('Staleness')
  if (snapshot.staleClients.length === 0) {
    lines.push('No clients flagged as stale.')
  } else {
    for (const client of snapshot.staleClients) {
      lines.push(`- ${client.clientName}: ${client.hoursSinceTouch} hours since last touch`)
    }
  }

  lines.push('')
  lines.push('Faith streak')
  lines.push(`Current streak: ${snapshot.faith.currentStreak} days`)
  lines.push(
    snapshot.faith.todayEntryLogged
      ? `Today's entry logged${snapshot.faith.todayBibleReference ? `: ${snapshot.faith.todayBibleReference}` : ''}`
      : "Today's entry not logged yet"
  )

  if (snapshot.yesterdaySummary) {
    lines.push('')
    lines.push('Yesterday')
    const clientGroups = snapshot.yesterdaySummary.clientGroups
    if (clientGroups.length === 0) {
      lines.push('No client work recorded yesterday.')
    } else {
      for (const group of clientGroups.slice(0, 5)) {
        lines.push(
          `- ${group.label}: ${formatMinutes(group.actualMinutes)} actual of ${formatMinutes(group.plannedMinutes)} planned`
        )
      }
    }
  }

  if (snapshot.bumpedTasks.length > 0) {
    lines.push('')
    lines.push('Recently bumped tasks')
    for (const task of snapshot.bumpedTasks) {
      lines.push(`- ${task.title} (${task.clientName}) deferred to ${task.deferredToDate}`)
    }
  }

  lines.push('')
  lines.push('AI providers are unavailable. This summary was generated from your local data.')

  return lines.join('\n')
}
