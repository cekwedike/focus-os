import { useEffect } from 'react'
import { buildProactiveGreetingMessages } from '@shared/chat/greeting'
import {
  resolveContextualChips,
  resolveWelcomeChipContext,
} from '@shared/chat/contextualChips'
import {
  isGreetingSentThisSession,
  markGreetingSentThisSession,
  shouldSendProactiveGreeting,
} from '@shared/chat/proactiveGreetingSession'
import { isBlockSkippable } from '@shared/schedule/blockSkippable'
import type { AssistantDeliveryInput } from '@shared/chat/assistantDelivery'
import { getTodayDateString } from '@renderer/utils/date'

interface UseProactiveGreetingOptions {
  initialized: boolean
  greetingComplete: boolean
  setGreetingComplete: (complete: boolean) => void
  deliverAssistantMessages: (messages: AssistantDeliveryInput[]) => Promise<void>
}

export function useProactiveGreeting({
  initialized,
  greetingComplete,
  setGreetingComplete,
  deliverAssistantMessages,
}: UseProactiveGreetingOptions): void {
  useEffect(() => {
    if (!initialized || greetingComplete) {
      return
    }

    if (!shouldSendProactiveGreeting(isGreetingSentThisSession())) {
      setGreetingComplete(true)
      return
    }

    void (async () => {
      const today = getTodayDateString()
      const [daily, settingsResponse, bundle, protectedBlocks] = await Promise.all([
        window.focusOS.daily.get({ date: today }),
        window.focusOS.settings.get(),
        window.focusOS.schedule.getDay({ date: today }),
        window.focusOS.protectedBlocks.list(),
      ])

      const wakeTimeLogged = Boolean(daily.settings?.wake_time)
      const blocks = bundle.blocks
      const activeBlock = blocks.find((block) => block.status === 'active') ?? null
      const now = Date.now()
      const nextBlock =
        blocks.find(
          (block) =>
            block.status === 'planned' && new Date(block.planned_start).getTime() >= now
        ) ??
        blocks.find((block) => block.status === 'planned') ??
        null

      const textMessages = buildProactiveGreetingMessages({
        wakeTimeLogged,
        userDisplayName: settingsResponse.settings.userDisplayName,
        welcomeBack: {
          wakeTimeLogged,
          hasSchedule: blocks.length > 0,
          activeBlock: activeBlock
            ? {
                title: activeBlock.title,
                planned_end: activeBlock.planned_end,
              }
            : null,
          nextBlock: nextBlock
            ? {
                title: nextBlock.title,
                planned_end: nextBlock.planned_end,
              }
            : null,
        },
      })

      const deliveries: AssistantDeliveryInput[] = textMessages.map((content, index) => {
        if (!wakeTimeLogged && index === 1) {
          return {
            content,
            quickReplies: resolveContextualChips('awaiting_wake'),
          }
        }

        if (wakeTimeLogged && index === 0) {
          const chipContext = activeBlock
            ? resolveWelcomeChipContext({
                activeBlock: {
                  block_type: activeBlock.block_type,
                  protected_subtype: activeBlock.protected_subtype,
                  skippable: isBlockSkippable(activeBlock, protectedBlocks),
                },
              })
            : 'welcome_standby'

          return {
            content,
            quickReplies: resolveContextualChips(chipContext),
          }
        }

        return content
      })

      await deliverAssistantMessages(deliveries)
      markGreetingSentThisSession()
      setGreetingComplete(true)
    })()
  }, [initialized, greetingComplete, setGreetingComplete, deliverAssistantMessages])
}
