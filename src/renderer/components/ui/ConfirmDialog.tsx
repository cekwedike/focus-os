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
    <div className="focus-modal-backdrop">
      <div className="focus-modal">
        <h4 className="font-display text-lg font-semibold text-text-primary">{title}</h4>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="focus-btn-ghost hover:bg-surface-elevated"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="focus-btn-primary hover:bg-accent-mint/30"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
