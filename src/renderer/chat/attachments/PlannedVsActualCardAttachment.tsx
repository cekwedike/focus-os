import type { PlannedVsActualCardAttachment } from '@shared/types/chat'

function barWidth(value: number, maxValue: number): string {
  if (maxValue <= 0) {
    return '0%'
  }
  return `${Math.max(4, Math.round((value / maxValue) * 100))}%`
}

interface PlannedVsActualCardAttachmentViewProps {
  attachment: PlannedVsActualCardAttachment
}

export function PlannedVsActualCardAttachmentView({
  attachment,
}: PlannedVsActualCardAttachmentViewProps): React.JSX.Element {
  const maxValue = attachment.rows.reduce(
    (max, row) => Math.max(max, row.plannedMinutes, row.actualMinutes),
    0
  )

  return (
    <div className="mt-2 rounded-panel border border-surface-border/80 bg-surface-elevated/40 p-3">
      <p className="focus-kicker mb-2">Planned Vs Actual ({attachment.dateLabel})</p>
      {attachment.rows.length === 0 ? (
        <p className="text-xs text-text-muted">No client work logged for this day yet.</p>
      ) : (
        <ul className="space-y-3">
          {attachment.rows.map((row) => (
            <li key={row.id}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-text-primary">{row.label}</span>
                <span className="text-text-muted">
                  {row.actualMinutes}/{row.plannedMinutes} min
                </span>
              </div>
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-text-muted">Plan</span>
                  <div className="h-1.5 flex-1 rounded-full bg-surface-elevated/80">
                    <div
                      className="h-1.5 rounded-full bg-accent-slate/70"
                      style={{ width: barWidth(row.plannedMinutes, maxValue) }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-text-muted">Actual</span>
                  <div className="h-1.5 flex-1 rounded-full bg-surface-elevated/80">
                    <div
                      className="h-1.5 rounded-full bg-accent-mint"
                      style={{ width: barWidth(row.actualMinutes, maxValue) }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
