import { createContext, useContext, type ReactNode } from 'react'

interface AssistantNavContextValue {
  openNav: () => void
  openSettings: () => void
}

const AssistantNavContext = createContext<AssistantNavContextValue | null>(null)

export function AssistantNavProvider({
  children,
  openNav,
  openSettings,
}: {
  children: ReactNode
  openNav: () => void
  openSettings: () => void
}): React.JSX.Element {
  return (
    <AssistantNavContext.Provider value={{ openNav, openSettings }}>
      {children}
    </AssistantNavContext.Provider>
  )
}

export function useAssistantNav(): AssistantNavContextValue {
  const context = useContext(AssistantNavContext)
  if (!context) {
    return {
      openNav: () => {},
      openSettings: () => {},
    }
  }
  return context
}
