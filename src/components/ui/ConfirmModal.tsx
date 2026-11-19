import type { ReactNode } from 'react'
import { MkButton } from './mk'
import { MkModal } from './MkModal'

/** A yes/no question in the app's modal (bottom sheet on phones). `danger` paints the confirm button red. */
export function ConfirmModal({ open, onClose, onConfirm, title, kicker, children, confirmLabel, cancelLabel = 'Cancel', loading = false, danger = false }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  kicker?: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  loading?: boolean
  danger?: boolean
}) {
  return <MkModal open={open} onClose={onClose} title={title} kicker={kicker} size="sm" footer={<>
    <MkButton secondary onClick={onClose}>{cancelLabel}</MkButton>
    <MkButton onClick={onConfirm} loading={loading} className={danger ? '!bg-[#B43A16] hover:!bg-[#9A3112]' : undefined}>{confirmLabel}</MkButton>
  </>}>
    <div className="text-sm leading-relaxed text-black/65">{children}</div>
  </MkModal>
}
