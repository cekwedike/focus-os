import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  const confirmClass =
    tone === 'danger' ? 'focus-btn-danger' : 'focus-btn-primary'

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="focus-modal-backdrop z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            className="hud-card hud-card-expanded focus-modal relative max-w-md border-accent-cyan/25 shadow-panel-active"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="hud-corner-bracket hud-corner-tl" aria-hidden="true" />
            <span className="hud-corner-bracket hud-corner-tr" aria-hidden="true" />
            <span className="hud-corner-bracket hud-corner-bl" aria-hidden="true" />
            <span className="hud-corner-bracket hud-corner-br" aria-hidden="true" />

            <p className="hud-kicker">Confirmation</p>
            <h3
              id="confirm-dialog-title"
              className="mt-2 font-display text-lg font-semibold text-text-primary"
            >
              {title}
            </h3>
            <p id="confirm-dialog-message" className="mt-2 text-sm leading-relaxed text-text-secondary">
              {message}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onCancel} className="focus-btn-ghost w-full sm:w-auto">
                {cancelLabel}
              </button>
              <button type="button" onClick={onConfirm} className={`${confirmClass} w-full sm:w-auto`}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
