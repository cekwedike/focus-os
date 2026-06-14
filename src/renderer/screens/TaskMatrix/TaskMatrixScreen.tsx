import { useState } from 'react'
import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'
import { TaskCard } from './components/TaskCard'
import { TaskEditDialog } from './components/TaskEditDialog'
import { TaskFilters } from './components/TaskFilters'
import { QuickAddBar } from './components/QuickAddBar'
import { useTaskMatrix } from './hooks/useTaskMatrix'
import type { TaskWithClient } from '@shared/types/tasks'

const screen = getScreenDefinition('/task-matrix')

export function TaskMatrixScreen(): React.JSX.Element {
  const {
    tasks,
    visibleClients,
    clientFilter,
    setClientFilter,
    priorityFilter,
    setPriorityFilter,
    loading,
    error,
    quickAdd,
    completeTask,
    deleteTask,
    updateTask,
  } = useTaskMatrix()

  const [editing, setEditing] = useState<TaskWithClient | null>(null)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description} />
      <TaskFilters
        clients={visibleClients}
        clientFilter={clientFilter}
        priorityFilter={priorityFilter}
        onClientFilterChange={setClientFilter}
        onPriorityFilterChange={setPriorityFilter}
      />
      {loading && <p className="text-sm text-text-muted">Loading tasks...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={(id) => void completeTask(id)}
            onEdit={setEditing}
            onDelete={(id) => void deleteTask(id)}
          />
        ))}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-text-muted">No tasks yet. Use Quick Add below.</p>
        )}
      </div>
      <QuickAddBar onSubmit={quickAdd} />
      <TaskEditDialog
        task={editing}
        clients={visibleClients}
        onClose={() => setEditing(null)}
        onSave={updateTask}
      />
    </div>
  )
}
