import { useCallback, useState } from 'react'
import type { TaskSummaryCardAttachment, TaskSummaryItem } from '@shared/types/chat'

interface TaskSummaryCardAttachmentViewProps {
  attachment: TaskSummaryCardAttachment
}

type TaskRowState = TaskSummaryItem & {
  saving?: boolean
  editing?: boolean
  draftTitle?: string
  removed?: boolean
}

export function TaskSummaryCardAttachmentView({
  attachment,
}: TaskSummaryCardAttachmentViewProps): React.JSX.Element {
  const [tasks, setTasks] = useState<TaskRowState[]>(() =>
    attachment.tasks.map((task) => ({ ...task }))
  )
  const [error, setError] = useState<string | null>(null)

  const visibleTasks = tasks.filter((task) => !task.removed)

  const updateTask = useCallback((taskId: number, patch: Partial<TaskRowState>): void => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    )
  }, [])

  const handleComplete = useCallback(async (task: TaskRowState): Promise<void> => {
    setError(null)
    updateTask(task.id, { saving: true })
    try {
      await window.focusOS.tasks.update({ id: task.id, status: 'completed' })
      updateTask(task.id, { status: 'completed', saving: false })
    } catch (completeError) {
      updateTask(task.id, { saving: false })
      setError(String(completeError))
    }
  }, [updateTask])

  const handleDelete = useCallback(async (task: TaskRowState): Promise<void> => {
    setError(null)
    updateTask(task.id, { saving: true })
    try {
      await window.focusOS.tasks.delete({ id: task.id })
      updateTask(task.id, { removed: true, saving: false })
    } catch (deleteError) {
      updateTask(task.id, { saving: false })
      setError(String(deleteError))
    }
  }, [updateTask])

  const handleSaveEdit = useCallback(
    async (task: TaskRowState): Promise<void> => {
      const nextTitle = task.draftTitle?.trim()
      if (!nextTitle || nextTitle === task.title) {
        updateTask(task.id, { editing: false, draftTitle: undefined })
        return
      }

      setError(null)
      updateTask(task.id, { saving: true })
      try {
        await window.focusOS.tasks.update({ id: task.id, title: nextTitle })
        updateTask(task.id, {
          title: nextTitle,
          editing: false,
          draftTitle: undefined,
          saving: false,
        })
      } catch (saveError) {
        updateTask(task.id, { saving: false })
        setError(String(saveError))
      }
    },
    [updateTask]
  )

  if (visibleTasks.length === 0) {
    return (
      <div className="mt-2 rounded-panel border border-surface-border/80 bg-surface-elevated/40 p-3">
        <p className="text-xs text-text-muted">No tasks in this card.</p>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-panel border border-surface-border/80 bg-surface-elevated/40 p-3">
      <p className="hud-kicker mb-2">Tasks</p>
      {error ? <p className="mb-2 text-xs text-accent-amber">{error}</p> : null}
      <ul className="space-y-2">
        {visibleTasks.map((task) => {
          const isDone = task.status === 'completed'
          return (
            <li
              key={task.id}
              className={`rounded-button border px-2.5 py-2 text-xs ${
                isDone
                  ? 'border-accent-mint/25 bg-accent-mint/5 opacity-70'
                  : 'border-surface-border/60 bg-surface-card/50'
              }`}
            >
              {task.editing ? (
                <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="text"
                    value={task.draftTitle ?? task.title}
                    onChange={(event) =>
                      updateTask(task.id, { draftTitle: event.target.value })
                    }
                    className="focus-input text-xs"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="focus-btn-primary !px-2 !py-1 !text-[10px]"
                      disabled={task.saving}
                      onClick={() => void handleSaveEdit(task)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="focus-btn-ghost !px-2 !py-1 !text-[10px]"
                      disabled={task.saving}
                      onClick={() =>
                        updateTask(task.id, { editing: false, draftTitle: undefined })
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`min-w-0 flex-1 font-medium ${
                        isDone ? 'text-text-muted line-through' : 'text-text-primary'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="shrink-0 text-text-muted">P{task.priority}</span>
                  </div>
                  <p className="mt-1 text-text-muted">
                    {task.clientName}
                    {task.deadlineDate ? ` · due ${task.deadlineDate}` : ''}
                  </p>
                  <div
                    className="mt-2 flex flex-wrap gap-1.5"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {!isDone ? (
                      <button
                        type="button"
                        className="focus-btn-primary !px-2 !py-1 !text-[10px]"
                        disabled={task.saving}
                        onClick={() => void handleComplete(task)}
                      >
                        Done
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="focus-btn-ghost !px-2 !py-1 !text-[10px]"
                      disabled={task.saving}
                      onClick={() =>
                        updateTask(task.id, { editing: true, draftTitle: task.title })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="focus-btn-ghost !px-2 !py-1 !text-[10px] text-accent-amber hover:text-accent-amber"
                      disabled={task.saving}
                      onClick={() => void handleDelete(task)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
