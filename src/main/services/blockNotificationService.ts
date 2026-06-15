import type { DailyScheduleRow } from '@shared/types/db'
import type { PreCompletionThreshold } from '@shared/schedule/preCompletionNotifications'
import {
  formatPreCompletionMessage,
  getDuePreCompletionThreshold,
  recalculateFiredThresholds,
} from '@shared/schedule/preCompletionNotifications'
import { resolveContextualChips } from '@shared/chat/contextualChips'
import { shouldAutoCompleteBlock } from '@shared/schedule/blockAutoComplete'
import { emitAssistantMessage } from './chatAssistantBridge'
import { showDesktopNotification } from './notificationService'
import { getEffectiveNowMs, isWorkPaused } from './workPauseService'

interface NotificationRuntimeState {
  blockId: number
  anchorPlannedEnd: string
  firedThresholds: Set<PreCompletionThreshold>
}

let runtimeState: NotificationRuntimeState | null = null

export function resetBlockNotificationState(): void {
  runtimeState = null
}

export function syncBlockNotificationState(block: DailyScheduleRow | null): void {
  if (!block || block.status !== 'active') {
    runtimeState = null
    return
  }

  if (!runtimeState || runtimeState.blockId !== block.id) {
    runtimeState = {
      blockId: block.id,
      anchorPlannedEnd: block.planned_end,
      firedThresholds: new Set(),
    }
    return
  }

  if (runtimeState.anchorPlannedEnd !== block.planned_end) {
    const effectiveNowMs = getEffectiveNowMs()
    runtimeState.anchorPlannedEnd = block.planned_end
    runtimeState.firedThresholds = recalculateFiredThresholds(
      block.planned_end,
      effectiveNowMs,
      runtimeState.firedThresholds
    )
  }
}

function firePreCompletionNotification(block: DailyScheduleRow, threshold: PreCompletionThreshold): void {
  const text = formatPreCompletionMessage(block.title, threshold)

  showDesktopNotification({
    title: 'Block Ending Soon',
    body: text,
    category: 'blockReminder',
  })

  emitAssistantMessage({
    text,
    quickReplies: resolveContextualChips('pre_completion_warning'),
    chipContext: 'pre_completion_warning',
  })
}

export function tickBlockNotifications(activeBlock: DailyScheduleRow | null, nowMs = Date.now()): void {
  if (!activeBlock || activeBlock.status !== 'active' || isWorkPaused()) {
    return
  }

  syncBlockNotificationState(activeBlock)

  if (!runtimeState || runtimeState.blockId !== activeBlock.id) {
    return
  }

  const effectiveNowMs = getEffectiveNowMs(nowMs)
  const dueThreshold = getDuePreCompletionThreshold(
    activeBlock.planned_end,
    effectiveNowMs,
    runtimeState.firedThresholds
  )

  if (!dueThreshold) {
    return
  }

  runtimeState.firedThresholds.add(dueThreshold)
  firePreCompletionNotification(activeBlock, dueThreshold)
}

export function shouldRunAutoComplete(
  block: DailyScheduleRow,
  nowMs = Date.now()
): boolean {
  if (isWorkPaused()) {
    return false
  }

  return shouldAutoCompleteBlock(block, nowMs)
}
