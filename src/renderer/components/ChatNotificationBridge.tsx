import { useNavigate } from 'react-router-dom'
import { NotificationProvider } from '@renderer/context/NotificationContext'
import { useChatInternals } from '@renderer/context/useChatContext'

export function ChatNotificationBridge({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const navigate = useNavigate()
  const {
    deliverNotificationToChat,
    resolveNotificationMessage,
    sendMessage,
  } = useChatInternals()

  return (
    <NotificationProvider
      deliverNotificationToChat={deliverNotificationToChat}
      resolveNotificationMessage={resolveNotificationMessage}
      onNavigate={(path) => navigate(path)}
      sendMessage={sendMessage}
    >
      {children}
    </NotificationProvider>
  )
}
