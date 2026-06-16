import { useMemo, useState } from 'react'
import type { ClientProjectRow } from '@shared/types/db'
import type { QuickAddParseResult } from '@shared/parsing/quickAddTask'
import { quickAddHasResolvedPriority } from '@shared/parsing/quickAddTask'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import {
  formatQuadrantLabel,
  hasResolvedEisenhower,
  type EisenhowerFlags,
} from '@shared/tasks/eisenhower'
import { EisenhowerQuadrantPicker } from './EisenhowerQuadrantPicker'

interface TaskMatrixComposerProps {
  clients: ClientProjectRow[]
  selectedClientId: number | 'personal'
  composeEisenhower: EisenhowerFlags
  composeSkipPriority: boolean
  onClientChange: (clientId: number | 'personal') => void
  onEisenhowerChange: (value: EisenhowerFlags, skipPriority: boolean) => void
  preview: (input: string) => QuickAddParseResult
  onSubmit: (value: string) => Promise<void>
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60}h`
  }
  return `${minutes}m`
}

export function TaskMatrixComposer({
  clients,
  selectedClientId,
  composeEisenhower,
  composeSkipPriority,
  onClientChange,
  onEisenhowerChange,
  preview,
  onSubmit,
}: TaskMatrixComposerProps): React.JSX.Element {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => preview(value), [preview, value])

  const priorityResolved =
    composeSkipPriority ||
    parsed.skipPriority ||
    hasResolvedEisenhower({
      isUrgent: parsed.isUrgent,
      isImportant: parsed.isImportant,
    })

  const canSubmit = Boolean(value.trim()) && priorityResolved

  const previewClientLabel = (() => {
    if (parsed.clientId == null) {
      return 'Personal'
    }
    const match = clients.find((client) => client.id === parsed.clientId)
    if (!match) {
      return 'Personal'
    }
    return isSystemUnassignedClient(match.name) ? 'Personal' : match.name
  })()

  const previewQuadrantLabel = parsed.skipPriority
    ? 'Inbox'
    : quickAddHasResolvedPriority(parsed)
      ? formatQuadrantLabel({ isUrgent: parsed.isUrgent, isImportant: parsed.isImportant })
      : composeSkipPriority
        ? 'Inbox'
        : formatQuadrantLabel(composeEisenhower)

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(value.trim())
      setValue('')
    } catch (submitError) {
      setError(String(submitError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="task-matrix-composer rounded-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="hud-kicker">Deploy task</p>
          <h2 className="font-display text-lg font-semibold text-text-primary">Quick Add</h2>
        </div>
        <p className="max-w-md text-xs text-text-muted">
          Jobs are optional. Describe the task, pick a quadrant, or drop it in Inbox. Mention
          &quot;for Acme&quot; to attach a job.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(180px,220px)_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
            Job (optional)
          </span>
          <select
            value={selectedClientId === 'personal' ? 'personal' : String(selectedClientId)}
            onChange={(event) => {
              const next = event.target.value
              onClientChange(next === 'personal' ? 'personal' : Number(next))
            }}
            className="focus-input w-full"
          >
            <option value="personal">Personal / no job</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
            Task description
          </span>
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleSubmit()
                }
              }}
              placeholder="Write proposal 2h by Friday · Q1 · for Acme"
              className="focus-input min-w-0 flex-1"
            />
            <button
              type="button"
              disabled={saving || !canSubmit}
              onClick={() => void handleSubmit()}
              className="focus-btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </label>
      </div>

      <div className="mt-4">
        <EisenhowerQuadrantPicker
          value={composeEisenhower}
          skipPriority={composeSkipPriority}
          onChange={onEisenhowerChange}
        />
      </div>

      {value.trim() && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="task-matrix-preview-chip rounded-badge px-2 py-1">Preview</span>
          <span className="text-xs text-text-secondary">{previewClientLabel}</span>
          {parsed.title && (
            <span className="text-xs text-text-secondary">&quot;{parsed.title}&quot;</span>
          )}
          <span className="text-xs text-text-muted">{formatMinutes(parsed.estimatedMinutes)}</span>
          {parsed.deadlineDate && (
            <span className="text-xs text-text-muted">Due {parsed.deadlineDate}</span>
          )}
          <span className="text-xs font-medium text-accent-cyan">{previewQuadrantLabel}</span>
          {!priorityResolved && (
            <span className="text-xs text-accent-amber">Pick a quadrant or Inbox</span>
          )}
        </div>
      )}

      {parsed.ambiguousClients && parsed.ambiguousClients.length > 1 && (
        <p className="mt-2 text-sm text-accent-amber">
          Ambiguous job match: {parsed.ambiguousClients.join(', ')}.
        </p>
      )}

      {!priorityResolved && value.trim() && (
        <p className="mt-2 text-xs text-text-muted">
          Tip: say &quot;do first&quot;, &quot;schedule&quot;, &quot;Q2&quot;, or &quot;no priority&quot; inline.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  )
}
