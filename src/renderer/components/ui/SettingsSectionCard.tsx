import type { ReactNode } from 'react'

interface SettingsSectionCardProps {
  title: string
  description: string
  children: ReactNode
}

export function SettingsSectionCard({
  title,
  description,
  children,
}: SettingsSectionCardProps): React.JSX.Element {
  return (
    <section className="focus-card">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}
