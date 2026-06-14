import type { ReactNode } from 'react'

interface ScreenCardProps {
  title: string
  description: string
  children?: ReactNode
}

export function ScreenCard({ title, description, children }: ScreenCardProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="focus-card">
        <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-text-secondary">{description}</p>
        {children}
      </div>
      <div className="focus-card-dashed mt-4">
        <p className="text-sm text-text-muted">
          Screen content will be built in a later roadmap phase. Navigation and shell are live.
        </p>
      </div>
    </div>
  )
}
