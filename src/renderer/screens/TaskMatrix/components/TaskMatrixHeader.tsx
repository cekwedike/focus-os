import type { TaskMatrixStats, TaskViewMode } from '../hooks/useTaskMatrix'

interface TaskMatrixHeaderProps {
  stats: TaskMatrixStats
  viewMode: TaskViewMode
  onViewModeChange: (mode: TaskViewMode) => void
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'mint' | 'cyan' | 'amber' | 'violet'
}): React.JSX.Element {
  const accentClass =
    accent === 'mint'
      ? 'text-accent-mint'
      : accent === 'amber'
        ? 'text-accent-amber'
        : accent === 'violet'
          ? 'text-accent-violet'
          : 'text-accent-cyan'

  return (
    <div className="task-matrix-stat rounded-panel p-3 sm:p-4">
      <p className="hud-kicker">{label}</p>
      <p className={`hud-value mt-1 text-2xl sm:text-3xl ${accentClass}`}>{value}</p>
    </div>
  )
}

export function TaskMatrixHeader({
  stats,
  viewMode,
  onViewModeChange,
}: TaskMatrixHeaderProps): React.JSX.Element {
  return (
    <section className="relative z-10 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="hud-kicker">Active module</span>
          <h1 className="focus-page-title mt-1">Task Matrix</h1>
          <p className="focus-page-desc mt-2 max-w-2xl">
            Eisenhower mission control. Sort by urgency and importance, attach a job when it helps,
            or leave tasks personal and untriaged in Inbox.
          </p>
        </div>
        <div className="flex gap-1 rounded-button border border-surface-border bg-surface/60 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('eisenhower')}
            className={`rounded-button px-3 py-1.5 text-sm font-medium ${
              viewMode === 'eisenhower'
                ? 'bg-accent-mint text-surface'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Eisenhower
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('jobs')}
            className={`rounded-button px-3 py-1.5 text-sm font-medium ${
              viewMode === 'jobs'
                ? 'bg-accent-mint text-surface'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            By job
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatBlock label="Open" value={stats.open} accent="mint" />
        <StatBlock label="Q1 · Do first" value={stats.doFirst} accent="amber" />
        <StatBlock label="Q2 · Schedule" value={stats.schedule} accent="cyan" />
        <StatBlock label="Inbox" value={stats.inbox} accent="violet" />
        <StatBlock label="Due this week" value={stats.dueSoon} accent="cyan" />
      </div>
    </section>
  )
}
