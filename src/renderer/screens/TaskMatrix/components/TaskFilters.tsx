import type { ClientProjectRow } from '@shared/types/db'
import type { PriorityFilter } from '../hooks/useTaskMatrix'

interface TaskFiltersProps {
  clients: ClientProjectRow[]
  clientFilter: number | 'all'
  priorityFilter: PriorityFilter
  onClientFilterChange: (value: number | 'all') => void
  onPriorityFilterChange: (value: PriorityFilter) => void
}

const PRIORITY_TABS: Array<{ id: PriorityFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High' },
  { id: 'recent', label: 'Recent' },
]

export function TaskFilters({
  clients,
  clientFilter,
  priorityFilter,
  onClientFilterChange,
  onPriorityFilterChange,
}: TaskFiltersProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <select
        value={clientFilter === 'all' ? 'all' : String(clientFilter)}
        onChange={(event) => {
          const value = event.target.value
          onClientFilterChange(value === 'all' ? 'all' : Number(value))
        }}
        className="focus-input"
      >
        <option value="all">All Jobs</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      <div className="flex gap-1 rounded-button border border-surface-border bg-surface p-1">
        {PRIORITY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onPriorityFilterChange(tab.id)}
            className={`rounded-button px-3 py-1.5 text-sm font-medium ${
              priorityFilter === tab.id
                ? 'bg-accent-mint text-surface'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
