import { motion } from 'framer-motion'
import {
  EISENHOWER_QUADRANTS,
  formatQuadrantDetail,
  type EisenhowerQuadrant,
} from '@shared/tasks/eisenhower'
import type { TaskWithClient } from '@shared/types/tasks'
import { TaskMatrixTaskCard } from './TaskMatrixTaskCard'
import type { EisenhowerTaskGroup } from '../hooks/useTaskMatrix'

interface EisenhowerBoardProps {
  groups: EisenhowerTaskGroup[]
  loading: boolean
  onComplete: (id: number) => void
  onEdit: (task: TaskWithClient) => void
  onDelete: (id: number) => void
}

function quadrantStyle(quadrant: EisenhowerQuadrant): { color: string; title: string; subtitle: string } {
  if (quadrant === 'unset') {
    return {
      color: '#64748b',
      title: 'Inbox',
      subtitle: 'Untriaged · no quadrant yet',
    }
  }
  const meta = EISENHOWER_QUADRANTS[quadrant]
  return { color: meta.color, title: meta.label, subtitle: meta.subtitle }
}

export function EisenhowerBoard({
  groups,
  loading,
  onComplete,
  onEdit,
  onDelete,
}: EisenhowerBoardProps): React.JSX.Element {
  if (loading) {
    return <p className="relative z-10 text-sm text-text-muted">Loading Eisenhower matrix...</p>
  }

  const hasTasks = groups.some((group) => group.tasks.length > 0)
  if (!hasTasks) {
    return (
      <div className="relative z-10 rounded-panel border border-dashed border-surface-border/80 bg-surface/40 p-8 text-center">
        <p className="font-display text-lg text-text-primary">Your matrix is clear</p>
        <p className="mt-2 text-sm text-text-muted">
          Drop a task below — pick a quadrant or leave it in Inbox until you triage.
        </p>
      </div>
    )
  }

  const matrixGroups = groups.filter((group) => group.quadrant !== 'unset')
  const inboxGroup = groups.find((group) => group.quadrant === 'unset')

  return (
    <div className="relative z-10 space-y-4">
      <div className="eisenhower-grid grid gap-3 md:grid-cols-2">
        {matrixGroups.map((group) => {
          const style = quadrantStyle(group.quadrant)
          return (
            <section
              key={group.quadrant}
              className="eisenhower-quadrant rounded-panel p-3 sm:p-4"
              style={{ borderColor: `${style.color}44` }}
            >
              <header className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="hud-kicker" style={{ color: style.color }}>
                    {group.quadrant === 'do_first'
                      ? 'Q1'
                      : group.quadrant === 'schedule'
                        ? 'Q2'
                        : group.quadrant === 'delegate'
                          ? 'Q3'
                          : 'Q4'}
                  </p>
                  <h2 className="font-display text-base font-semibold text-text-primary">
                    {style.title}
                  </h2>
                  <p className="text-xs text-text-muted">{style.subtitle}</p>
                </div>
                <span
                  className="rounded-badge px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${style.color}18`, color: style.color }}
                >
                  {group.tasks.length}
                </span>
              </header>
              <div className="space-y-2">
                {group.tasks.length === 0 ? (
                  <p className="text-xs text-text-muted">Nothing here</p>
                ) : (
                  group.tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <TaskMatrixTaskCard
                        task={task}
                        accentColor={style.color}
                        compact
                        onComplete={onComplete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>

      {inboxGroup && inboxGroup.tasks.length > 0 && (
        <section className="eisenhower-inbox rounded-panel p-4">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="hud-kicker text-text-muted">Untriaged</p>
              <h2 className="font-display text-base font-semibold text-text-primary">Inbox</h2>
              <p className="text-xs text-text-muted">{formatQuadrantDetail({ isUrgent: null, isImportant: null })}</p>
            </div>
            <span className="rounded-badge border border-surface-border px-2 py-1 text-xs text-text-muted">
              {inboxGroup.tasks.length}
            </span>
          </header>
          <div className="grid gap-2 sm:grid-cols-2">
            {inboxGroup.tasks.map((task) => (
              <TaskMatrixTaskCard
                key={task.id}
                task={task}
                accentColor="#64748b"
                compact
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
