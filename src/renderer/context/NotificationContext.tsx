import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ActiveNotificationSummary, NotificationDispatchedPayload } from '@shared/types/notifications'
import type { DueCheckInEntry } from '@shared/types/ipc'
import { mapNotificationActionsToChips } from '@shared/notifications/mapActionsToChips'
import { buildNotificationAttachments } from '@shared/chat/attachments/buildNotificationAttachments'

interface NotificationContextValue {
  activeNotifications: ActiveNotificationSummary[]
  dueCheckInEntries: DueCheckInEntry[]
  refreshDueCheckIns: () => Promise<void>
  refreshNotifications: () => Promise<void>
  performAction: (notificationId: number, actionId: string) => Promise<{ sendText?: string; navigate?: string }>
  onMicroBreakDispatched: (listener: () => void) => () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({
  children,
  deliverNotificationToChat,
  resolveNotificationMessage,
  onNavigate,
  sendMessage,
}: {
  children: ReactNode
  deliverNotificationToChat: (input: {
    content: string
    quickReplies?: ReturnType<typeof mapNotificationActionsToChips>
    notificationId?: number
    attachments?: import('@shared/types/chat').ChatAttachment[]
  }) => Promise<void>
  resolveNotificationMessage: (notificationId: number) => void
  onNavigate: (path: string) => void
  sendMessage: (text: string) => Promise<void>
}): React.JSX.Element {
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotificationSummary[]>([])
  const [dueCheckInEntries, setDueCheckInEntries] = useState<DueCheckInEntry[]>([])
  const [microBreakListeners] = useState(() => new Set<() => void>())

  const refreshDueCheckIns = useCallback(async (): Promise<void> => {
    const response = await window.focusOS.checkIns.getDue()
    setDueCheckInEntries(response.due)
  }, [])

  const refreshActive = useCallback(async (): Promise<void> => {
    const response = await window.focusOS.notifications.listActive()
    setActiveNotifications(response.active)
  }, [])

  const refreshNotifications = useCallback(async (): Promise<void> => {
    await Promise.all([refreshActive(), refreshDueCheckIns()])
  }, [refreshActive, refreshDueCheckIns])

  const performAction = useCallback(
    async (
      notificationId: number,
      actionId: string
    ): Promise<{ sendText?: string; navigate?: string }> => {
      const result = await window.focusOS.notifications.action({
        notificationId,
        actionId,
      })

      if (result.acknowledged) {
        resolveNotificationMessage(notificationId)
      }

      await Promise.all([refreshActive(), refreshDueCheckIns()])

      if (result.sendText) {
        await sendMessage(result.sendText)
      }

      if (result.navigate) {
        onNavigate(result.navigate)
      }

      return { sendText: result.sendText, navigate: result.navigate }
    },
    [onNavigate, refreshActive, refreshDueCheckIns, resolveNotificationMessage, sendMessage]
  )

  useEffect(() => {
    void refreshActive()
    void refreshDueCheckIns()

    const unsubDispatched = window.focusOS.onNotificationDispatched((payload: NotificationDispatchedPayload) => {
      if (payload.type === 'micro_break' && !payload.skippedDuplicate) {
        for (const listener of microBreakListeners) {
          listener()
        }
      }

      if (payload.showInChat && !payload.skippedDuplicate) {
        const briefingContent =
          typeof payload.metadata?.content === 'string' ? payload.metadata.content : null
        void deliverNotificationToChat({
          content: briefingContent ?? payload.message,
          quickReplies: mapNotificationActionsToChips(payload.actions),
          notificationId: payload.id,
          attachments: buildNotificationAttachments(payload.metadata),
        })
      }

      if (payload.persistent) {
        void refreshActive()
      }

      void refreshDueCheckIns()
    })

    const unsubState = window.focusOS.onNotificationStateChanged((payload) => {
      setActiveNotifications(payload.active)
      void refreshDueCheckIns()
    })

    const unsubAck = window.focusOS.onNotificationAcknowledged((payload) => {
      resolveNotificationMessage(payload.notificationId)
      void refreshActive()
      void refreshDueCheckIns()
    })

    return () => {
      unsubDispatched()
      unsubState()
      unsubAck()
    }
  }, [
    deliverNotificationToChat,
    microBreakListeners,
    refreshActive,
    refreshDueCheckIns,
    resolveNotificationMessage,
  ])

  const onMicroBreakDispatched = useCallback((listener: () => void) => {
    microBreakListeners.add(listener)
    return () => {
      microBreakListeners.delete(listener)
    }
  }, [microBreakListeners])

  const value = useMemo(
    () => ({
      activeNotifications,
      dueCheckInEntries,
      refreshDueCheckIns,
      refreshNotifications,
      performAction,
      onMicroBreakDispatched,
    }),
    [
      activeNotifications,
      dueCheckInEntries,
      refreshDueCheckIns,
      refreshNotifications,
      performAction,
      onMicroBreakDispatched,
    ]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
