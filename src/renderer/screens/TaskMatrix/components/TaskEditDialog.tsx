import { useEffect, useState } from 'react'
import type { TaskWithClient, UpdateTaskInput } from '@shared/types/tasks'
import type { ClientProjectRow } from '@shared/types/db'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { taskRowToEisenhower, type EisenhowerFlags } from '@shared/tasks/eisenhower'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TextInput } from '@renderer/components/ui/TextInput'
import { EisenhowerQuadrantPicker } from './EisenhowerQuadrantPicker'

interface TaskEditDialogProps {
  task: TaskWithClient | null
  clients: ClientProjectRow[]
  unassignedClientId: number | null
  onClose: () => void
  onSave: (id: number, patch: Omit<UpdateTaskInput, 'id'>) => Promise<void>
}

export function TaskEditDialog({
  task,
  clients,
  unassignedClientId,
  onClose,
  onSave,
}: TaskEditDialogProps): React.JSX.Element | null {
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState<number | 'personal'>('personal')
  const [eisenhower, setEisenhower] = useState<EisenhowerFlags>({ isUrgent: null, isImportant: null })
  const [skipPriority, setSkipPriority] = useState(false)
  const [estimate, setEstimate] = useState(30)
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!task) {
      return
    }
    setTitle(task.title)
    setClientId(isSystemUnassignedClient(task.client_name) ? 'personal' : task.client_id)
    const flags = taskRowToEisenhower(task)
    const unset = flags.isUrgent == null && flags.isImportant == null
    setSkipPriority(unset)
    setEisenhower(flags)
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
        client_id:
          clientId === 'personal' ? (unassignedClientId ?? task.client_id) : clientId,
        is_urgent: skipPriority ? null : eisenhower.isUrgent,
        is_important: skipPriority ? null : eisenhower.isImportant,
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
      <div className="focus-modal max-w-lg">
        <h3 className="font-display text-lg font-semibold text-text-primary">Edit Task</h3>
        <div className="mt-4 space-y-4">
          <FormField label="Title">
            <TextInput value={title} onChange={setTitle} />
          </FormField>
          <FormField label="Job (optional)">
            <select
              value={clientId === 'personal' ? 'personal' : String(clientId)}
              onChange={(event) => {
                const next = event.target.value
                setClientId(next === 'personal' ? 'personal' : Number(next))
              }}
              className="focus-input"
            >
              <option value="personal">Personal / no job</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </FormField>
          <EisenhowerQuadrantPicker
            value={eisenhower}
            skipPriority={skipPriority}
            onChange={(value, skip) => {
              setEisenhower(value)
              setSkipPriority(skip)
            }}
          />
          <FormField label="Estimate (Minutes)">
            <NumberInput value={estimate} min={1} onChange={setEstimate} />
          </FormField>
          <FormField label="Deadline (YYYY-MM-DD)">
            <TextInput value={deadline} onChange={setDeadline} placeholder="Optional" />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="focus-btn-ghost">
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
