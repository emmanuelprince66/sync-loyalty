import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The app's modal: a bottom sheet on phones (full width, slides up, thumb-reachable buttons) and a
 * centred dialog from `sm` up. Header with kicker + title + close, scrolling body, sticky footer.
 */
export function MkModal({ open, onClose, title, kicker, description, children, footer, size = 'md' }: {
  open: boolean
  onClose: () => void
  title: string
  kicker?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  return <Dialog.Root open={open} onOpenChange={next => { if (!next) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0"/>
      <Dialog.Content className={cn(
        'fixed inset-x-0 bottom-0 z-[80] flex max-h-[92dvh] w-full flex-col rounded-t-[24px] bg-[#F6F6F2] shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
        'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95',
        size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-xl',
      )}>
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-black/15 sm:hidden" aria-hidden="true"/>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {kicker && <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">{kicker}</p>}
            <Dialog.Title className="text-lg font-black leading-tight sm:text-xl">{title}</Dialog.Title>
            {description ? <Dialog.Description className="mt-1 text-xs text-black/50">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white transition hover:bg-black/80"><X size={16}/></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-black/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto">{footer}</div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
