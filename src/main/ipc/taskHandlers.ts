import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type { CreateTaskInput, TaskListFilters, UpdateTaskInput } from '@shared/types/tasks'
import { getDatabase } from '../db/connection'
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasksWithClients,
  updateTask,
} from '../db/repositories/tasksRepository'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:list', async (_event, filters: TaskListFilters = {}) => {
    try {
      return success(listTasksWithClients(getDatabase(), filters))
    } catch (error) {
      return failure('TASKS_LIST_FAILED', String(error))
    }
  })

  ipcMain.handle('tasks:get', async (_event, payload: { id: number }) => {
    try {
      const task = getTaskById(getDatabase(), payload.id)
      if (!task) {
        return failure('TASK_NOT_FOUND', `Task ${payload.id} not found`)
      }
      return success(task)
    } catch (error) {
      return failure('TASK_GET_FAILED', String(error))
    }
  })

  ipcMain.handle('tasks:create', async (_event, payload: CreateTaskInput) => {
    try {
      if (!payload.title?.trim()) {
        return failure('VALIDATION_ERROR', 'Task title is required')
      }
      return success(createTask(getDatabase(), payload))
    } catch (error) {
      return failure('TASK_CREATE_FAILED', String(error))
    }
  })

  ipcMain.handle('tasks:update', async (_event, payload: UpdateTaskInput) => {
    try {
      const updated = updateTask(getDatabase(), payload)
      if (!updated) {
        return failure('TASK_NOT_FOUND', `Task ${payload.id} not found`)
      }
      return success(updated)
    } catch (error) {
      return failure('TASK_UPDATE_FAILED', String(error))
    }
  })

  ipcMain.handle('tasks:delete', async (_event, payload: { id: number }) => {
    try {
      const deleted = deleteTask(getDatabase(), payload.id)
      return success({ deleted })
    } catch (error) {
      return failure('TASK_DELETE_FAILED', String(error))
    }
  })
}
