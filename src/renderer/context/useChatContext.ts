import { useContext } from 'react'
import {
  ChatContext,
  ChatInternalsContext,
  type ChatContextValue,
  type ChatInternalsValue,
} from './chatContexts'

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}

export function useChatInternals(): ChatInternalsValue {
  const context = useContext(ChatInternalsContext)
  if (!context) {
    throw new Error('useChatInternals must be used within ChatProvider')
  }
  return context
}
