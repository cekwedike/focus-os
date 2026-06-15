import { useMemo, useState } from 'react'
import type { ClientProjectRow } from '@shared/types/db'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import { Toggle } from '@renderer/components/ui/Toggle'
import { WeightTotalBanner } from '@renderer/components/ui/WeightTotalBanner'
import { ClientProjectCard } from './ClientProjectCard'
import { ClientProjectForm } from './ClientProjectForm'

interface ClientsProjectsSectionProps {
  clients: ClientProjectRow[]
  onClientsChange: (clients: ClientProjectRow[]) => void
}

export function ClientsProjectsSection({
  clients,
  onClientsChange,
}: ClientsProjectsSectionProps): React.JSX.Element {
  const [showInactive, setShowInactive] = useState(false)
  const [editing, setEditing] = useState<ClientProjectRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [deactivating, setDeactivating] = useState<ClientProjectRow | null>(null)

  const visibleClients = useMemo(
    () =>
      clients.filter(
        (client) => (showInactive || client.is_active === 1) && !isSystemUnassignedClient(client.name)
      ),
    [clients, showInactive]
  )

  const activeWeightTotal = useMemo(
    () =>
      clients
        .filter(
          (client) =>
            client.is_active === 1 &&
            client.fixed_block_enabled !== 1 &&
            !isSystemUnassignedClient(client.name)
        )
        .reduce((sum, client) => sum + client.weight_percent, 0),
    [clients]
  )

  const handleSave = async (
    values: Parameters<typeof window.focusOS.clients.create>[0] & { id?: number }
  ): Promise<void> => {
    if (values.id) {
      const updated = await window.focusOS.clients.update({
        id: values.id,
        name: values.name,
        color: values.color,
        weight_percent: values.weight_percent,
        is_active: values.is_active,
        fixed_block_enabled: values.fixed_block_enabled,
        fixed_block_start: values.fixed_block_start,
        fixed_block_duration_minutes: values.fixed_block_duration_minutes,
        reminder_enabled: values.reminder_enabled,
        reminder_interval_minutes: values.reminder_interval_minutes,
        reminder_label: values.reminder_label,
      })
      onClientsChange(clients.map((client) => (client.id === updated.id ? updated : client)))
      setEditing(null)
      return
    }

    const created = await window.focusOS.clients.create(values)
    onClientsChange([...clients, created])
    setCreating(false)
  }

  const handleDeactivate = async (): Promise<void> => {
    if (!deactivating) {
      return
    }
    const updated = await window.focusOS.clients.update({
      id: deactivating.id,
      is_active: false,
    })
    onClientsChange(clients.map((client) => (client.id === updated.id ? updated : client)))
    setDeactivating(null)
  }

  return (
    <SettingsSectionCard
      title="Clients And Projects"
      description="Who you work for and how much of your flexible day goes to each. Percentages should add up to 100%."
    >
      <WeightTotalBanner total={activeWeightTotal} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          label="Show Paused Clients"
          checked={showInactive}
          onChange={setShowInactive}
          showState
        />
        <button
          type="button"
          onClick={() => {
            setCreating(true)
            setEditing(null)
          }}
          className="focus-btn-primary"
        >
          Add Client
        </button>
      </div>

      <div className="space-y-3">
        {visibleClients.map((client) => (
          <ClientProjectCard
            key={client.id}
            client={client}
            onEdit={(selected) => {
              setEditing(selected)
              setCreating(false)
            }}
            onDeactivate={setDeactivating}
          />
        ))}
        {visibleClients.length === 0 && (
          <p className="text-sm text-text-muted">
            No clients yet. Tap Add Client to set up who you work for.
          </p>
        )}
      </div>

      {(creating || editing) && (
        <div className="focus-panel p-4">
          <h4 className="mb-3 text-sm font-semibold text-text-primary">
            {editing ? 'Edit Client' : 'New Client'}
          </h4>
          <ClientProjectForm
            initial={editing}
            onCancel={() => {
              setCreating(false)
              setEditing(null)
            }}
            onSubmit={handleSave}
          />
        </div>
      )}

      <ConfirmDialog
        open={deactivating !== null}
        title="Pause This Client?"
        message={`Pause "${deactivating?.name}"? Their tasks stay saved, but this client will be hidden from your active schedule until you turn them back on.`}
        confirmLabel="Pause Client"
        onConfirm={() => void handleDeactivate()}
        onCancel={() => setDeactivating(null)}
      />
    </SettingsSectionCard>
  )
}
