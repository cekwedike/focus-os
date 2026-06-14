import type { PlannedActualGroup } from '@shared/types/review'

interface PlannedActualChartProps {
  title: string
  groups: PlannedActualGroup[]
  emptyMessage: string
}

function barWidth(value: number, maxValue: number): string {
  if (maxValue <= 0) {
    return '0%'
  }
  return `${Math.max(4, Math.round((value / maxValue) * 100))}%`
}

export function PlannedActualChart({
  title,
  groups,
  emptyMessage,
}: PlannedActualChartProps): React.JSX.Element {
  const maxValue = groups.reduce(
    (max, group) => Math.max(max, group.plannedMinutes, group.actualMinutes),
    0
  )

  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-5">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-xs text-text-muted">
        Horizontal bars compare planned vs actual minutes. No chart library, CSS flex bars only.
      </p>
      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {groups.map((group) => (
            <li key={group.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-text-primary">{group.label}</span>
                <span className="text-xs text-text-muted">
                  {group.actualMinutes}/{group.plannedMinutes} min
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-14 text-xs text-text-muted">Planned</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-elevated">
                    <div
                      className="h-2 rounded-full bg-slate-400/70"
                      style={{ width: barWidth(group.plannedMinutes, maxValue) }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-xs text-text-muted">Actual</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-elevated">
                    <div
                      className="h-2 rounded-full bg-accent-mint/80"
                      style={{ width: barWidth(group.actualMinutes, maxValue) }}
                    />
                  </div>
                </div>
              </div>
              {group.notStartedCount > 0 && (
                <p className="mt-1 text-xs text-amber-200/90">
                  {group.notStartedCount} blocks not started
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
