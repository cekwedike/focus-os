import { useState } from 'react'

import { ChatInputBar } from '@renderer/chat/ChatInputBar'

import { ChatThread } from '@renderer/chat/ChatThread'

import { useProactiveGreeting } from '@renderer/chat/hooks/useProactiveGreeting'

import { useChatContext } from '@renderer/context/useChatContext'

import { AssistantHomeChrome } from './AssistantHomeChrome'

import { AssistantNowPlayingStrip } from './AssistantNowPlayingStrip'

import { TodayPlanSheet } from './TodayPlanSheet'

import { ConfirmDialog } from '@renderer/components/modals/ConfirmDialog'



export function ChatPanel(): React.JSX.Element {

  const {

    initialized,

    greetingComplete,

    setGreetingComplete,

    deliverAssistantMessages,

    aiThinking,

    isTyping,

    sending,

    messages,

    clearChat,

  } = useChatContext()

  const [todayOpen, setTodayOpen] = useState(false)

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)



  useProactiveGreeting({

    initialized,

    greetingComplete,

    setGreetingComplete,

    deliverAssistantMessages,

  })



  return (

    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-base">

      <AssistantHomeChrome
        onOpenToday={() => setTodayOpen(true)}
        onClearChat={() => {
          if (messages.length > 0) {
            setClearConfirmOpen(true)
          } else {
            clearChat()
          }
        }}
      />



      <div className="relative z-10 flex min-h-0 flex-1 flex-col">

        <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-3 sm:px-4">

          <AssistantNowPlayingStrip />

          <ChatThread />

        </div>

        <ChatInputBar />

      </div>



      <TodayPlanSheet open={todayOpen} onClose={() => setTodayOpen(false)} />



      <ConfirmDialog

        open={clearConfirmOpen}

        title="Clear conversation?"

        message="All messages in this thread will be removed. This cannot be undone."

        confirmLabel="Clear"

        cancelLabel="Keep"

        tone="danger"

        onConfirm={() => {

          clearChat()

          setClearConfirmOpen(false)

        }}

        onCancel={() => setClearConfirmOpen(false)}

      />

    </div>

  )

}


