import type { ClientProjectRow } from '@shared/types/db'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { formatDurationLabel } from '@renderer/components/ui/DurationInput'

interface ClientProjectCardProps {
  client: ClientProjectRow
  onEdit: (client: ClientProjectRow) => void
  onDeactivate: (client: ClientProjectRow) => void
}

export function ClientProjectCard({
  client,
  onEdit,
  onDeactivate,
}: ClientProjectCardProps): React.JSX.Element {
  const { formatHHMM } = useDisplayPreferences()

  const fixedSummary =
    client.fixed_block_enabled && client.fixed_block_start
      ? `Same time daily: ${formatHHMM(client.fixed_block_start)} (${formatDurationLabel(client.fixed_block_duration_minutes ?? 0)})`
      : 'Flexible timing'

  return (
    <article className="focus-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: client.color }}
            aria-hidden
          />
          <div>
            <h4 className="font-medium text-text-primary">{client.name}</h4>
            <p className="text-xs text-text-muted">
              {client.weight_percent}% of flexible time · {fixedSummary}
            </p>
          </div>
        </div>
        <span
          className={`focus-badge ${client.is_active ? 'focus-badge-mint' : ''}`}
        >
          {client.is_active ? 'On schedule' : 'Paused'}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(client)}
          className="focus-btn-ghost !px-3 !py-1.5 !text-xs hover:bg-surface-card"
        >
          Edit
        </button>
        {client.is_active === 1 && (
          <button
            type="button"
            onClick={() => onDeactivate(client)}
            className="rounded-button border border-surface-border px-3 py-1.5 text-xs text-text-muted hover:bg-surface-card"
          >
            Remove
          </button>
        )}
      </div>
    </article>
  )
}
