interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element | null {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="focus-card w-full max-w-md">
        <h4 className="text-lg font-semibold text-text-primary">{title}</h4>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-button border border-surface-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-button bg-accent-mint/20 px-3 py-2 text-sm font-medium text-accent-mint hover:bg-accent-mint/30"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
