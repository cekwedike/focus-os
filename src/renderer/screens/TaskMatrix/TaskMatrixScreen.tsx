import { useState } from 'react'
import '@renderer/screens/Home/hud/hud.css'
import './task-matrix.css'
import { EisenhowerBoard } from './components/EisenhowerBoard'
import { TaskEditDialog } from './components/TaskEditDialog'
import { TaskMatrixBoard } from './components/TaskMatrixBoard'
import { TaskMatrixComposer } from './components/TaskMatrixComposer'
import { TaskMatrixHeader } from './components/TaskMatrixHeader'
import { TaskMatrixJobRail } from './components/TaskMatrixJobRail'
import { useTaskMatrix } from './hooks/useTaskMatrix'
import type { TaskWithClient } from '@shared/types/tasks'

export function TaskMatrixScreen(): React.JSX.Element {
  const {
    eisenhowerGroups,
    jobGroups,
    visibleClients,
    clientFilter,
    setClientFilter,
    quadrantFilter,
    setQuadrantFilter,
    viewMode,
    setViewMode,
    composeClientId,
    setComposeClientId,
    composeEisenhower,
    setComposeEisenhower,
    composeSkipPriority,
    setComposeSkipPriority,
    stats,
    taskCountsByClient,
    unassignedClientId,
    loading,
    error,
    previewQuickAdd,
    quickAdd,
    completeTask,
    deleteTask,
    updateTask,
  } = useTaskMatrix()

  const [editing, setEditing] = useState<TaskWithClient | null>(null)

  return (
    <div className="task-matrix-shell hud-shell mx-auto max-w-6xl space-y-6 pb-6">
      <TaskMatrixHeader stats={stats} viewMode={viewMode} onViewModeChange={setViewMode} />
      <TaskMatrixJobRail
        clients={visibleClients}
        clientFilter={clientFilter}
        quadrantFilter={quadrantFilter}
        taskCounts={taskCountsByClient}
        onClientFilterChange={setClientFilter}
        onQuadrantFilterChange={setQuadrantFilter}
      />
      {error && <p className="relative z-10 text-sm text-red-400">{error}</p>}
      {viewMode === 'eisenhower' ? (
        <EisenhowerBoard
          groups={eisenhowerGroups}
          loading={loading}
          onComplete={(id) => void completeTask(id)}
          onEdit={setEditing}
          onDelete={(id) => void deleteTask(id)}
        />
      ) : (
        <TaskMatrixBoard
          groups={jobGroups}
          loading={loading}
          onComplete={(id) => void completeTask(id)}
          onEdit={setEditing}
          onDelete={(id) => void deleteTask(id)}
        />
      )}
      <TaskMatrixComposer
        clients={visibleClients}
        selectedClientId={composeClientId}
        composeEisenhower={composeEisenhower}
        composeSkipPriority={composeSkipPriority}
        onClientChange={setComposeClientId}
        onEisenhowerChange={(value, skip) => {
          setComposeEisenhower(value)
          setComposeSkipPriority(skip)
        }}
        preview={previewQuickAdd}
        onSubmit={quickAdd}
      />
      <TaskEditDialog
        task={editing}
        clients={visibleClients}
        unassignedClientId={unassignedClientId}
        onClose={() => setEditing(null)}
        onSave={updateTask}
      />
    </div>
  )
}
