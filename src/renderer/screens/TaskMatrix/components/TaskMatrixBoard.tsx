import { motion } from 'framer-motion'
import type { TaskWithClient } from '@shared/types/tasks'
import { TaskMatrixTaskCard } from './TaskMatrixTaskCard'
import type { TaskMatrixJobGroup } from '../hooks/useTaskMatrix'

interface TaskMatrixBoardProps {
  groups: TaskMatrixJobGroup[]
  loading: boolean
  onComplete: (id: number) => void
  onEdit: (task: TaskWithClient) => void
  onDelete: (id: number) => void
}

export function TaskMatrixBoard({
  groups,
  loading,
  onComplete,
  onEdit,
  onDelete,
}: TaskMatrixBoardProps): React.JSX.Element {
  if (loading) {
    return <p className="relative z-10 text-sm text-text-muted">Loading tasks...</p>
  }

  const hasTasks = groups.some((group) => group.tasks.length > 0)

  if (!hasTasks) {
    return (
      <div className="relative z-10 rounded-panel border border-dashed border-surface-border/80 bg-surface/40 p-8 text-center">
        <p className="font-display text-lg text-text-primary">No tasks in this view</p>
        <p className="mt-2 text-sm text-text-muted">Add one below — job optional, priority your call.</p>
      </div>
    )
  }

  return (
    <div className="task-matrix-board-scroll relative z-10 flex items-start gap-4 overflow-x-auto pb-2">
      {groups.map((group) => (
        <div key={group.label} className="task-matrix-column rounded-panel p-3">
          <div
            className="task-matrix-column-accent"
            style={{ backgroundColor: group.color }}
            aria-hidden="true"
          />
          <header className="mb-3 px-1">
            <h2 className="font-display text-sm font-semibold text-text-primary">{group.label}</h2>
            <p className="text-xs text-text-muted">
              {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
            </p>
          </header>
          <div className="space-y-2">
            {group.tasks.length === 0 ? (
              <p className="px-1 text-xs text-text-muted">No tasks yet</p>
            ) : (
              group.tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <TaskMatrixTaskCard
                    task={task}
                    accentColor={group.color}
                    compact
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
