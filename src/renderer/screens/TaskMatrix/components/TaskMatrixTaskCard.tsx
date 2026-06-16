import type { TaskWithClient } from '@shared/types/tasks'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import {
  formatQuadrantDetail,
  formatQuadrantLabel,
  taskRowToEisenhower,
} from '@shared/tasks/eisenhower'

interface TaskMatrixTaskCardProps {
  task: TaskWithClient
  accentColor: string
  compact?: boolean
  onComplete: (id: number) => void
  onEdit: (task: TaskWithClient) => void
  onDelete: (id: number) => void
}

export function TaskMatrixTaskCard({
  task,
  accentColor,
  compact = false,
  onComplete,
  onEdit,
  onDelete,
}: TaskMatrixTaskCardProps): React.JSX.Element {
  const flags = taskRowToEisenhower(task)
  const quadrantLabel = formatQuadrantLabel(flags)
  const quadrantDetail = formatQuadrantDetail(flags)
  const clientLabel = isSystemUnassignedClient(task.client_name) ? 'Personal' : task.client_name

  return (
    <article
      className={`task-matrix-task rounded-panel ${compact ? 'p-3' : 'p-4'}`}
      style={{ borderLeftColor: `${accentColor}88`, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={`font-medium text-text-primary ${compact ? 'text-sm' : ''}`}>
            {task.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium" style={{ color: accentColor }}>
              {quadrantLabel}
            </span>
            {!compact && <span className="text-text-muted">{quadrantDetail}</span>}
            <span
              className="rounded-badge px-2 py-0.5"
              style={{ backgroundColor: `${task.client_color}22`, color: task.client_color }}
            >
              {clientLabel}
            </span>
            <span className="text-text-muted">{task.estimated_minutes ?? 30} min</span>
            {task.deadline_date && (
              <span className="text-text-muted">Due {task.deadline_date}</span>
            )}
          </div>
        </div>
      </div>
      <div className={`flex gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
        {task.status !== 'completed' && (
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            className="focus-btn-primary !px-2.5 !py-1 !text-[11px]"
          >
            Done
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="focus-btn-ghost !px-2.5 !py-1 !text-[11px]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-button border border-surface-border px-2.5 py-1 text-[11px] text-text-muted"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
