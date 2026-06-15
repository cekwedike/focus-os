import { useEffect } from 'react'
import { buildProactiveGreetingMessages } from '@shared/chat/greeting'
import {
  isGreetingSentThisSession,
  markGreetingSentThisSession,
  shouldSendProactiveGreeting,
} from '@shared/chat/proactiveGreetingSession'
import { getTodayDateString } from '@renderer/utils/date'

interface UseProactiveGreetingOptions {
  initialized: boolean
  greetingComplete: boolean
  setGreetingComplete: (complete: boolean) => void
  deliverAssistantMessages: (messages: string[]) => Promise<void>
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
      const [daily, settingsResponse, bundle] = await Promise.all([
        window.focusOS.daily.get({ date: today }),
        window.focusOS.settings.get(),
        window.focusOS.schedule.getDay({ date: today }),
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

      const messages = buildProactiveGreetingMessages({
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

      await deliverAssistantMessages(messages)
      markGreetingSentThisSession()
      setGreetingComplete(true)
    })()
  }, [initialized, greetingComplete, setGreetingComplete, deliverAssistantMessages])
}
