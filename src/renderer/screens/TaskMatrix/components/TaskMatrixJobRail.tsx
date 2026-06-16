import type { ClientProjectRow } from '@shared/types/db'
import type { QuadrantFilter } from '../hooks/useTaskMatrix'

interface TaskMatrixJobRailProps {
  clients: ClientProjectRow[]
  clientFilter: number | 'all'
  quadrantFilter: QuadrantFilter
  taskCounts: Map<number, number>
  onClientFilterChange: (value: number | 'all') => void
  onQuadrantFilterChange: (value: QuadrantFilter) => void
}

const QUADRANT_TABS: Array<{ id: QuadrantFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'do_first', label: 'Q1' },
  { id: 'schedule', label: 'Q2' },
  { id: 'delegate', label: 'Q3' },
  { id: 'eliminate', label: 'Q4' },
  { id: 'unset', label: 'Inbox' },
  { id: 'recent', label: 'Recent' },
]

export function TaskMatrixJobRail({
  clients,
  clientFilter,
  quadrantFilter,
  taskCounts,
  onClientFilterChange,
  onQuadrantFilterChange,
}: TaskMatrixJobRailProps): React.JSX.Element {
  return (
    <section className="relative z-10 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="hud-kicker">Filters</p>
        <div className="task-matrix-board-scroll flex max-w-full gap-1 overflow-x-auto rounded-button border border-surface-border bg-surface/60 p-1">
          {QUADRANT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onQuadrantFilterChange(tab.id)}
              className={`shrink-0 rounded-button px-3 py-1.5 text-sm font-medium transition-colors ${
                quadrantFilter === tab.id
                  ? 'bg-accent-mint text-surface'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="task-matrix-board-scroll flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onClientFilterChange('all')}
          className={`task-matrix-job-pill shrink-0 rounded-panel px-4 py-3 text-left ${
            clientFilter === 'all' ? 'task-matrix-job-pill-active' : ''
          }`}
        >
          <span className="block text-xs uppercase tracking-wider text-text-muted">Jobs</span>
          <span className="mt-1 block font-display text-sm font-semibold text-text-primary">
            All
          </span>
        </button>
        {clients.map((client) => {
          const count = taskCounts.get(client.id) ?? 0
          const active = clientFilter === client.id
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onClientFilterChange(client.id)}
              className={`task-matrix-job-pill shrink-0 rounded-panel px-4 py-3 text-left ${
                active ? 'task-matrix-job-pill-active' : ''
              }`}
              style={
                active
                  ? { borderColor: `${client.color}88`, boxShadow: `0 0 18px ${client.color}22` }
                  : undefined
              }
            >
              <span
                className="mb-2 inline-block h-1.5 w-8 rounded-full"
                style={{ backgroundColor: client.color }}
                aria-hidden="true"
              />
              <span className="block font-display text-sm font-semibold text-text-primary">
                {client.name}
              </span>
              <span className="mt-1 block text-xs text-text-muted">
                {count} open task{count === 1 ? '' : 's'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
