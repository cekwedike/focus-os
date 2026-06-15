import { useEffect, useState } from 'react'
import type { TaskWithClient, UpdateTaskInput } from '@shared/types/tasks'
import type { ClientProjectRow } from '@shared/types/db'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TextInput } from '@renderer/components/ui/TextInput'

interface TaskEditDialogProps {
  task: TaskWithClient | null
  clients: ClientProjectRow[]
  onClose: () => void
  onSave: (id: number, patch: Omit<UpdateTaskInput, 'id'>) => Promise<void>
}

export function TaskEditDialog({
  task,
  clients,
  onClose,
  onSave,
}: TaskEditDialogProps): React.JSX.Element | null {
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState(0)
  const [priority, setPriority] = useState(3)
  const [estimate, setEstimate] = useState(30)
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!task) {
      return
    }
    setTitle(task.title)
    setClientId(task.client_id)
    setPriority(task.priority)
    setEstimate(task.estimated_minutes ?? 30)
    setDeadline(task.deadline_date ?? '')
  }, [task])

  if (!task) {
    return null
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      await onSave(task.id, {
        title,
        client_id: clientId,
        priority,
        estimated_minutes: estimate,
        deadline_date: deadline || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="focus-modal-backdrop">
      <div className="focus-modal">
        <h3 className="font-display text-lg font-semibold text-text-primary">Edit Task</h3>
        <div className="mt-4 space-y-3">
          <FormField label="Title">
            <TextInput value={title} onChange={setTitle} />
          </FormField>
          <FormField label="Client">
            <select
              value={clientId}
              onChange={(event) => setClientId(Number(event.target.value))}
              className="focus-input"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Priority (1 = highest)">
            <NumberInput value={priority} min={1} max={5} onChange={setPriority} />
          </FormField>
          <FormField label="Estimate (Minutes)">
            <NumberInput value={estimate} min={1} onChange={setEstimate} />
          </FormField>
          <FormField label="Deadline (YYYY-MM-DD)">
            <TextInput value={deadline} onChange={setDeadline} placeholder="Optional" />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="focus-btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
