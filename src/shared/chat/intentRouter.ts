import { matchAcknowledgeCheckInIntent } from './intents/acknowledgeCheckInIntent'
import { matchTaskPriorityIntent } from './intents/taskPriorityIntent'
import { matchAddTaskIntent } from './intents/addTaskIntent'
import { matchCompleteBlockIntent, matchStartBlockIntent } from './intents/blockActionIntent'
import { matchExtendBlockIntent, matchSkipBlockIntent } from './intents/blockProgressionIntent'
import { matchEndBreakIntent, matchLongBreakIntent } from './intents/breakIntent'
import { matchFaithLogIntent } from './intents/faithLogIntent'
import { matchMenuIntent } from './intents/menuIntent'
import { matchQueryScheduleIntent, matchQueryStreakIntent } from './intents/queryIntent'
import { matchQueryStatusIntent, matchQueryTasksIntent, matchCompleteTaskIntent, matchDeleteTaskIntent, matchUpdateTaskIntent, matchReplanDayIntent } from './intents/statusAndTaskIntent'
import { matchFindMeetingSlotIntent } from './intents/findMeetingSlotIntent'
import { matchAcceptEmailTaskIntent, matchTriageInboxIntent } from './intents/integrationIntent'
import { buildUnrecognizedMatch } from './intents/unrecognizedIntent'
import { matchWakeTimeIntent } from './intents/wakeTimeIntent'
import type { IntentMatch, RouterContext } from './routerContext'

type IntentMatcher = (input: string, context: RouterContext) => IntentMatch | null

const INTENT_MATCHERS: IntentMatcher[] = [
  matchMenuIntent,
  matchWakeTimeIntent,
  matchTaskPriorityIntent,
  matchEndBreakIntent,
  matchLongBreakIntent,
  matchFaithLogIntent,
  matchStartBlockIntent,
  matchAcknowledgeCheckInIntent,
  matchCompleteBlockIntent,
  matchExtendBlockIntent,
  matchSkipBlockIntent,
  matchAddTaskIntent,
  matchQueryScheduleIntent,
  matchQueryStreakIntent,
  matchQueryStatusIntent,
  matchQueryTasksIntent,
  (input, context) => matchCompleteTaskIntent(input, { tasks: context.openTasks ?? [] }),
  (input, context) => matchDeleteTaskIntent(input, { tasks: context.openTasks ?? [] }),
  (input, context) => matchUpdateTaskIntent(input, { tasks: context.openTasks ?? [] }),
  matchReplanDayIntent,
  (input, context) => matchFindMeetingSlotIntent(input, { today: context.today }),
  matchTriageInboxIntent,
  matchAcceptEmailTaskIntent,
]

export function classifyIntent(input: string, context: RouterContext): IntentMatch {
  const trimmed = input.trim()
  if (!trimmed) {
    return buildUnrecognizedMatch()
  }

  for (const matcher of INTENT_MATCHERS) {
    const result = matcher(trimmed, context)
    if (result) {
      return result
    }
  }

  return buildUnrecognizedMatch()
}

export function shouldInvokeIpc(match: IntentMatch): boolean {
  return match.requiresIpc && match.intent !== 'unrecognized'
}
