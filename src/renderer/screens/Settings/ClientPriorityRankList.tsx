import type { ClientProjectRow } from '@shared/types/db'
import { weightsFromPriorityRank } from '@shared/clients/priorityWeights'

interface ClientPriorityRankListProps {
  clients: ClientProjectRow[]
  onReorder: (clients: ClientProjectRow[]) => void
}

export function ClientPriorityRankList({
  clients,
  onReorder,
}: ClientPriorityRankListProps): React.JSX.Element {
  const flexibleClients = clients
    .filter((client) => client.is_active === 1 && client.fixed_block_enabled !== 1)
    .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id)

  const move = (index: number, direction: -1 | 1): void => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= flexibleClients.length) {
      return
    }

    const reordered = [...flexibleClients]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    const weights = weightsFromPriorityRank(
      reordered.map((client, sortIndex) => ({
        id: client.id,
        sortOrder: sortIndex,
        fixedBlockEnabled: false,
      }))
    )

    const updatedById = new Map(
      reordered.map((client, sortIndex) => [
        client.id,
        {
          ...client,
          sort_order: sortIndex,
          weight_percent: weights.get(client.id) ?? client.weight_percent,
        },
      ])
    )

    onReorder(clients.map((client) => updatedById.get(client.id) ?? client))
  }

  if (flexibleClients.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Add flexible clients to set priority. Fixed-time clients are scheduled separately.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-muted">
        Drag priority — top clients get more of your flexible day. You never need to think in
        percentages.
      </p>
      <ol className="space-y-2">
        {flexibleClients.map((client, index) => (
          <li key={client.id} className="focus-panel flex items-center gap-3 p-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: client.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-primary">{client.name}</p>
              <p className="text-xs text-text-muted">Priority {index + 1}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                className="focus-btn-ghost !px-2 !py-0.5 text-xs"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Move ${client.name} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="focus-btn-ghost !px-2 !py-0.5 text-xs"
                disabled={index === flexibleClients.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Move ${client.name} down`}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
