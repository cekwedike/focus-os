import type { ReplanSummary } from '@shared/allocation/types'
import type { ChatScreenLink } from '@shared/types/chat'
import type { TimeFormat } from '@shared/types/settings'
import type { RouterBlockSummary } from './routerContext'
import { formatHHMM } from '@shared/utils/displayTime'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'

function formatScheduleClock(iso: string, timeFormat: TimeFormat = '12h'): string {
  return formatHHMM(extractLocalTimeHHMM(iso), timeFormat)
}

export function wakeTimePrompt(): string {
  return 'What time did you wake up?'
}

export function morningPlanPreview(
  wakeTime: string,
  blocks: RouterBlockSummary[],
  hoursUntilWindDown?: number | null
): string {
  const hoursLine =
    hoursUntilWindDown && hoursUntilWindDown > 0
      ? `You've got about ${hoursUntilWindDown} hour${hoursUntilWindDown === 1 ? '' : 's'} before wind-down. `
      : ''

  const blockNames = blocks
    .filter((block) => block.block_type !== 'buffer' && block.block_type !== 'break')
    .slice(0, 6)
    .map((block) => block.title)

  const flow =
    blockNames.length > 0
      ? `Here's how I'd run today: ${blockNames.join(' → ')}${blocks.length > blockNames.length ? ' → …' : ''}.`
      : 'I could not build blocks yet — check your clients and tasks.'

  return `Got it — wake time ${wakeTime}. ${hoursLine}${flow} Tap **Looks good** when you're ready and I'll start your first block.`
}

export function wakeTimeConfirmedSummary(
  wakeTime: string,
  blocks: RouterBlockSummary[]
): string {
  const lines = [
    `Got it. I logged your wake time as ${wakeTime} and built today's schedule.`,
    '',
    "Today's plan:",
  ]

  if (blocks.length === 0) {
    lines.push('- No blocks were generated yet.')
  } else {
    for (const block of blocks.slice(0, 12)) {
      const start = block.planned_start ? formatScheduleClock(block.planned_start) : 'TBD'
      lines.push(`- ${start}: ${block.title} (${block.status})`)
    }
    if (blocks.length > 12) {
      lines.push(`- ...and ${blocks.length - 12} more blocks`)
    }
  }

  lines.push('', 'Say "what\'s next" anytime to check your day.')
  return lines.join('\n')
}

export function taskAdded(taskTitle: string, clientName: string, quadrantLabel?: string): string {
  const priorityLine = quadrantLabel ? ` Priority: ${quadrantLabel}.` : ''
  const clientLine = clientName === 'Personal' ? '' : ` for ${clientName}`
  return `Added "${taskTitle}"${clientLine}.${priorityLine} It will be included the next time your schedule is generated.`.replace(
    '..',
    '.'
  )
}

export function taskPriorityPrompt(taskTitle: string): string {
  return [
    `Got it — "${taskTitle}".`,
    '',
    'Where does this land on your Eisenhower matrix?',
    '',
    'Q1 Do First · urgent & important',
    'Q2 Schedule · important, not urgent',
    'Q3 Delegate · urgent, not important',
    'Q4 Later · neither urgent nor important',
    '',
    'Or say "no priority" to drop it in your inbox untriaged.',
  ].join('\n')
}

export function blockStarted(title: string): string {
  return `Started "${title}". I'll track this block as active.`
}

export function blockCompleted(title: string): string {
  return `Marked "${title}" complete. Nice work.`
}

export function longBreakStarted(reason: string, plannedMinutes: number | null): string {
  const durationText =
    plannedMinutes && plannedMinutes > 0 ? ` Expected back in about ${plannedMinutes} minutes.` : ''
  return `Long break started${reason ? `: ${reason}` : ''}.${durationText} Say "I'm back" when you return.`
}

export function replanSummaryText(summary: ReplanSummary): string {
  const lines = [
    'Day re-planned after your break.',
    summary.message,
    `Time lost: ${summary.longBreakDurationMinutes} minutes`,
    `Protected blocks unchanged: ${summary.protectedBlocksUnchanged}`,
  ]

  if (summary.blocksCompressed.length > 0) {
    lines.push('', 'Compressed blocks:')
    for (const entry of summary.blocksCompressed) {
      lines.push(`- ${entry.beforeMinutes} min to ${entry.afterMinutes} min`)
    }
  }

  if (summary.bumpedTaskIds.length > 0) {
    lines.push(`Bumped tasks to tomorrow: ${summary.bumpedTaskIds.length}`)
  }

  return lines.join('\n')
}

export function scheduleOverview(
  blocks: RouterBlockSummary[],
  nextBlock: RouterBlockSummary | null
): string {
  const lines = ["Here's your day:"]

  if (blocks.length === 0) {
    lines.push('No schedule blocks yet. Log your wake time to generate today\'s plan.')
    return lines.join('\n')
  }

  for (const block of blocks) {
    const start = block.planned_start ? formatScheduleClock(block.planned_start) : 'TBD'
    lines.push(`- ${start}: ${block.title} (${block.status})`)
  }

  if (nextBlock) {
    lines.push('', `Up next: ${nextBlock.title}`)
  }

  return lines.join('\n')
}

export function faithStreakSummary(currentStreak: number, longestStreak: number): string {
  return `Faith streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'} current, ${longestStreak} day${longestStreak === 1 ? '' : 's'} longest.`
}

export function menuList(screens: ChatScreenLink[]): string {
  const lines = ['Available screens:']
  screens.forEach((screen, index) => {
    lines.push(`${index + 1}. ${screen.label} (${screen.path})`)
  })
  lines.push('', 'Use the icon rail on the left, or navigate directly in the app.')
  return lines.join('\n')
}

export function unrecognized(): string {
  return (
    "I didn't quite catch that. For now I can help with logging your wake time, adding tasks, " +
    'starting or finishing things, taking breaks, and checking your schedule or streak. ' +
    'More natural conversation is coming soon.'
  )
}

export function ambiguousClient(names: string[]): string {
  return `Which client did you mean: ${names.join(' or ')}? Please try again with the full client name.`
}

export function ambiguousBlock(titles: string[]): string {
  return `Which block did you mean: ${titles.join(' or ')}? Please be more specific.`
}

export function faithLogSaved(reference: string): string {
  return `Logged faith time: ${reference}. Entry saved.`
}

export function endBreakAcknowledged(): string {
  return "Welcome back. I'm updating your schedule now."
}

export function noActiveBlockToComplete(): string {
  return 'No active block to complete right now. Say "starting [block name]" to begin one.'
}

export function noMatchingBlock(action: 'start' | 'complete'): string {
  return action === 'start'
    ? 'I could not find a planned block matching that name.'
    : 'I could not find a block to complete matching that name.'
}

export function checkInAcknowledged(clientName: string): string {
  return `Got it. ${clientName} check-in marked complete.`
}

export function queryStatusSummary(score: number | null): string {
  if (score === null) {
    return "Here's how your day is going so far. No client work blocks are on today's schedule yet."
  }
  return `Here's how your day is going. Your focus score is ${score}%.`
}

export function replanDayPrompt(): string {
  return (
    'To replan your day with custom settings, tell me your wake time, sleep target, capacity in hours, and buffer percent. ' +
    'Example: "replan: woke at 8am, sleep at 11pm, 7 hours capacity, 15% buffer". ' +
    'Or open Task Matrix and Daily Workspace tools from the icon rail for full control.'
  )
}

export function taskCompleted(title: string): string {
  return `Marked "${title}" complete.`
}

export function taskDeleted(title: string): string {
  return `Removed "${title}" from your task list.`
}

export function taskUpdated(previousTitle: string, newTitle: string): string {
  return `Updated task from "${previousTitle}" to "${newTitle}".`
}

export function taskListIntro(count: number): string {
  if (count === 0) {
    return 'You have no open tasks right now.'
  }
  return `Here are your ${count} open task${count === 1 ? '' : 's'}:`
}
