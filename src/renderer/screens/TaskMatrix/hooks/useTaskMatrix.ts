import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { parseQuickAddTask } from '@shared/parsing/quickAddTask'
import type { TaskWithClient } from '@shared/types/tasks'
import type { ClientProjectRow } from '@shared/types/db'

export type PriorityFilter = 'all' | 'high' | 'recent'

export function useTaskMatrix() {
  const [tasks, setTasks] = useState<TaskWithClient[]>([])
  const [clients, setClients] = useState<ClientProjectRow[]>([])
  const [clientFilter, setClientFilter] = useState<number | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unassignedClientId, setUnassignedClientId] = useState<number | null>(null)

  const visibleClients = useMemo(
    () => clients.filter((client) => !isSystemUnassignedClient(client.name)),
    [clients]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [taskRows, clientRows] = await Promise.all([
        window.focusOS.tasks.list({
          clientId: clientFilter === 'all' ? undefined : clientFilter,
          priorityMax: priorityFilter === 'high' ? 2 : undefined,
          recentOnly: priorityFilter === 'recent' ? true : undefined,
        }),
        window.focusOS.clients.list(),
      ])
      setTasks(taskRows)
      setClients(clientRows)
      const unassigned = clientRows.find((client) => isSystemUnassignedClient(client.name))
      setUnassignedClientId(unassigned?.id ?? null)
    } catch (loadError) {
      setError(String(loadError))
    } finally {
      setLoading(false)
    }
  }, [clientFilter, priorityFilter])

  useEffect(() => {
    void load()
  }, [load])

  const quickAdd = async (input: string): Promise<void> => {
    if (!unassignedClientId) {
      throw new Error('Unassigned client not ready')
    }
    const parsed = parseQuickAddTask(
      input,
      visibleClients.map((client) => ({ id: client.id, name: client.name })),
      unassignedClientId
    )
    await window.focusOS.tasks.create({
      client_id: parsed.clientId ?? unassignedClientId,
      title: parsed.title,
      priority: parsed.priority,
      deadline_date: parsed.deadlineDate,
      estimated_minutes: parsed.estimatedMinutes,
    })
    await load()
  }

  const completeTask = async (id: number): Promise<void> => {
    await window.focusOS.tasks.update({ id, status: 'completed' })
    await load()
  }

  const deleteTask = async (id: number): Promise<void> => {
    await window.focusOS.tasks.delete({ id })
    await load()
  }

  const updateTask = async (id: number, patch: Omit<import('@shared/types/tasks').UpdateTaskInput, 'id'>): Promise<void> => {
    await window.focusOS.tasks.update({ ...patch, id })
    await load()
  }

  return {
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
    refresh: load,
  }
}
