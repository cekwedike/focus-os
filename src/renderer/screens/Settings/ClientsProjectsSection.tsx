import { useMemo, useState } from 'react'
import type { ClientProjectRow } from '@shared/types/db'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { rebalanceClientWeights } from '@shared/clients/priorityWeights'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import { Toggle } from '@renderer/components/ui/Toggle'
import { ClientProjectCard } from './ClientProjectCard'
import { ClientProjectForm } from './ClientProjectForm'
import { ClientPriorityRankList } from './ClientPriorityRankList'

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

  const activeFlexibleCount = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.is_active === 1 &&
          client.fixed_block_enabled !== 1 &&
          !isSystemUnassignedClient(client.name)
      ).length,
    [clients]
  )

  const persistClients = async (nextClients: ClientProjectRow[]): Promise<void> => {
    const rebalanced = rebalanceClientWeights(
      nextClients.map((client) => ({
        id: client.id,
        sortOrder: client.sort_order,
        fixedBlockEnabled: client.fixed_block_enabled === 1,
        weight_percent: client.weight_percent,
      }))
    )
    const weightById = new Map(rebalanced.map((client) => [client.id, client.weight_percent]))

    const updates = await Promise.all(
      nextClients.map((client) =>
        window.focusOS.clients.update({
          id: client.id,
          sort_order: client.sort_order,
          weight_percent: weightById.get(client.id) ?? client.weight_percent,
        })
      )
    )

    const byId = new Map(updates.map((client) => [client.id, client]))
    onClientsChange(nextClients.map((client) => byId.get(client.id) ?? client))
  }

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
      const next = clients.map((client) => (client.id === updated.id ? updated : client))
      await persistClients(next)
      setEditing(null)
      return
    }

    const maxSort = clients.reduce((max, client) => Math.max(max, client.sort_order), -1)
    const created = await window.focusOS.clients.create({
      ...values,
      sort_order: maxSort + 1,
    })
    await persistClients([...clients, created])
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
    const next = clients.map((client) => (client.id === updated.id ? updated : client))
    await persistClients(next)
    setDeactivating(null)
  }

  return (
    <SettingsSectionCard
      title="My Jobs"
      description="Who you work for and what matters most today. Higher priority clients get more flexible time."
    >
      {activeFlexibleCount > 1 ? (
        <ClientPriorityRankList
          clients={clients}
          onReorder={(next) => {
            void persistClients(next)
          }}
        />
      ) : null}

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
        {visibleClients.map((client, index) => (
          <ClientProjectCard
            key={client.id}
            client={client}
            priorityRank={
              client.fixed_block_enabled === 1
                ? null
                : visibleClients
                    .filter((row) => row.is_active === 1 && row.fixed_block_enabled !== 1)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .findIndex((row) => row.id === client.id) + 1 || index + 1
            }
            onEdit={(selected) => {
              setEditing(selected)
              setCreating(false)
            }}
            onDeactivate={setDeactivating}
          />
        ))}
        {visibleClients.length === 0 && (
          <p className="text-sm text-text-muted">
            No clients yet. Say &quot;set up my jobs&quot; in chat or tap Add Client.
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
