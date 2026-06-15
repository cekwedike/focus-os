import type { ReactNode } from 'react'

interface ScreenCardProps {
  title: string
  description: string
  children?: ReactNode
}

export function ScreenCard({ title, description, children }: ScreenCardProps): React.JSX.Element {
  return (
    <header className="focus-page-header">
      <span className="focus-kicker">Active module</span>
      <h1 className="focus-page-title">{title}</h1>
      <p className="focus-page-desc">{description}</p>
      {children}
    </header>
  )
}
