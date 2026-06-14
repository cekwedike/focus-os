import type { TaskWithClient } from '@shared/types/tasks'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'

interface TaskCardProps {
  task: TaskWithClient
  onComplete: (id: number) => void
  onEdit: (task: TaskWithClient) => void
  onDelete: (id: number) => void
}

function priorityLabel(priority: number): string {
  if (priority <= 1) return 'Urgent'
  if (priority <= 2) return 'High'
  if (priority <= 3) return 'Normal'
  return 'Low'
}

export function TaskCard({ task, onComplete, onEdit, onDelete }: TaskCardProps): React.JSX.Element {
  const clientLabel = isSystemUnassignedClient(task.client_name) ? 'Unassigned' : task.client_name

  return (
    <article className="rounded-button border border-surface-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-text-primary">{task.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-badge px-2 py-0.5 font-medium"
              style={{ backgroundColor: `${task.client_color}22`, color: task.client_color }}
            >
              {clientLabel}
            </span>
            <span className="focus-badge">{priorityLabel(task.priority)}</span>
            <span className="text-text-muted">{task.estimated_minutes ?? 30} min</span>
            {task.deadline_date && (
              <span className="text-text-muted">Due {task.deadline_date}</span>
            )}
            <span className="text-text-muted capitalize">{task.status}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {task.status !== 'completed' && (
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            className="rounded-button bg-accent-mint/20 px-3 py-1.5 text-xs font-medium text-accent-mint"
          >
            Mark Complete
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-button border border-surface-border px-3 py-1.5 text-xs text-text-secondary"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-button border border-surface-border px-3 py-1.5 text-xs text-text-muted"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
