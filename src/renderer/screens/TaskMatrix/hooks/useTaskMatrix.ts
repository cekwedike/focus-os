import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { parseQuickAddTask } from '@shared/parsing/quickAddTask'
import {
  EISENHOWER_QUADRANTS,
  resolveQuadrant,
  taskRowToEisenhower,
  type EisenhowerFlags,
  type EisenhowerQuadrant,
} from '@shared/tasks/eisenhower'
import type { TaskWithClient } from '@shared/types/tasks'
import type { ClientProjectRow } from '@shared/types/db'

export type TaskViewMode = 'eisenhower' | 'jobs'
export type QuadrantFilter = EisenhowerQuadrant | 'all' | 'recent'

export interface TaskMatrixStats {
  open: number
  doFirst: number
  schedule: number
  inbox: number
  dueSoon: number
}

export interface EisenhowerTaskGroup {
  quadrant: EisenhowerQuadrant
  tasks: TaskWithClient[]
}

export interface TaskMatrixJobGroup {
  label: string
  color: string
  clientId: number | null
  tasks: TaskWithClient[]
}

export function useTaskMatrix() {
  const [tasks, setTasks] = useState<TaskWithClient[]>([])
  const [clients, setClients] = useState<ClientProjectRow[]>([])
  const [clientFilter, setClientFilter] = useState<number | 'all'>('all')
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter>('all')
  const [viewMode, setViewMode] = useState<TaskViewMode>('eisenhower')
  const [composeClientId, setComposeClientId] = useState<number | 'personal'>('personal')
  const [composeEisenhower, setComposeEisenhower] = useState<EisenhowerFlags>({
    isUrgent: null,
    isImportant: null,
  })
  const [composeSkipPriority, setComposeSkipPriority] = useState(true)
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
          quadrant:
            quadrantFilter !== 'all' && quadrantFilter !== 'recent'
              ? quadrantFilter
              : undefined,
          recentOnly: quadrantFilter === 'recent' ? true : undefined,
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
  }, [clientFilter, quadrantFilter])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo((): TaskMatrixStats => {
    const openTasks = tasks.filter((task) => task.status !== 'completed')
    const today = new Date().toISOString().slice(0, 10)
    const weekAhead = new Date()
    weekAhead.setDate(weekAhead.getDate() + 7)
    const weekEnd = weekAhead.toISOString().slice(0, 10)

    return {
      open: openTasks.length,
      doFirst: openTasks.filter(
        (task) => resolveQuadrant(taskRowToEisenhower(task)) === 'do_first'
      ).length,
      schedule: openTasks.filter(
        (task) => resolveQuadrant(taskRowToEisenhower(task)) === 'schedule'
      ).length,
      inbox: openTasks.filter((task) => resolveQuadrant(taskRowToEisenhower(task)) === 'unset')
        .length,
      dueSoon: openTasks.filter(
        (task) =>
          task.deadline_date &&
          task.deadline_date >= today &&
          task.deadline_date <= weekEnd
      ).length,
    }
  }, [tasks])

  const eisenhowerGroups = useMemo((): EisenhowerTaskGroup[] => {
    const order: EisenhowerQuadrant[] = ['do_first', 'schedule', 'delegate', 'eliminate', 'unset']
    const buckets = new Map<EisenhowerQuadrant, TaskWithClient[]>()
    for (const quadrant of order) {
      buckets.set(quadrant, [])
    }

    for (const task of tasks) {
      const quadrant = resolveQuadrant(taskRowToEisenhower(task))
      buckets.get(quadrant)?.push(task)
    }

    return order.map((quadrant) => ({
      quadrant,
      tasks: buckets.get(quadrant) ?? [],
    }))
  }, [tasks])

  const jobGroups = useMemo((): TaskMatrixJobGroup[] => {
    const buckets = new Map<number, TaskWithClient[]>()
    for (const task of tasks) {
      const bucket = buckets.get(task.client_id) ?? []
      bucket.push(task)
      buckets.set(task.client_id, bucket)
    }

    const groups: TaskMatrixJobGroup[] = []
    const personalTasks = tasks.filter((task) => isSystemUnassignedClient(task.client_name))

    if (personalTasks.length > 0 || clientFilter === 'all') {
      groups.push({
        label: 'Personal',
        color: '#94a3b8',
        clientId: unassignedClientId,
        tasks: personalTasks,
      })
    }

    for (const client of visibleClients) {
      if (clientFilter !== 'all' && client.id !== clientFilter) {
        continue
      }
      groups.push({
        label: client.name,
        color: client.color,
        clientId: client.id,
        tasks: buckets.get(client.id) ?? [],
      })
    }

    return groups.filter((group) => group.tasks.length > 0 || clientFilter !== 'all')
  }, [clientFilter, tasks, unassignedClientId, visibleClients])

  const previewQuickAdd = useCallback(
    (input: string) => {
      const defaultClientId =
        composeClientId === 'personal' ? null : composeClientId
      return parseQuickAddTask(
        input,
        visibleClients.map((client) => ({ id: client.id, name: client.name })),
        {
          defaultClientId,
          fallbackClientId: unassignedClientId ?? undefined,
          defaultEisenhower: composeSkipPriority ? undefined : composeEisenhower,
        }
      )
    },
    [composeClientId, composeEisenhower, composeSkipPriority, unassignedClientId, visibleClients]
  )

  const quickAdd = async (input: string): Promise<void> => {
    if (!unassignedClientId) {
      throw new Error('Task storage is not ready yet.')
    }

    const parsed = previewQuickAdd(input)
    if (parsed.ambiguousClients && parsed.ambiguousClients.length > 1) {
      throw new Error(`Which job? Matches: ${parsed.ambiguousClients.join(', ')}`)
    }
    if (!parsed.title.trim()) {
      throw new Error('Describe what you need to do.')
    }

    const skip = composeSkipPriority || parsed.skipPriority
    const isUrgent = skip ? null : parsed.isUrgent ?? composeEisenhower.isUrgent
    const isImportant = skip ? null : parsed.isImportant ?? composeEisenhower.isImportant

    await window.focusOS.tasks.create({
      client_id: parsed.clientId ?? unassignedClientId,
      title: parsed.title,
      is_urgent: isUrgent,
      is_important: isImportant,
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

  const updateTask = async (
    id: number,
    patch: Omit<import('@shared/types/tasks').UpdateTaskInput, 'id'>
  ): Promise<void> => {
    await window.focusOS.tasks.update({ ...patch, id })
    await load()
  }

  const taskCountsByClient = useMemo(() => {
    const counts = new Map<number, number>()
    for (const task of tasks) {
      if (task.status === 'completed') {
        continue
      }
      counts.set(task.client_id, (counts.get(task.client_id) ?? 0) + 1)
    }
    return counts
  }, [tasks])

  return {
    tasks,
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
    refresh: load,
    quadrantMeta: EISENHOWER_QUADRANTS,
  }
}
