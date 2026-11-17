import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Building blocks copied from the maheleKart loyalty design (black, lime #D7FF45, off-white #F6F6F2). */

export const LIME = '#D7FF45'
export const CARD_COLOURS = ['#D7FF45', '#FF6B3D', '#B9A7FF', '#52D6FF', '#F2C94C', '#000000'] as const

type Tone = 'lime' | 'orange' | 'purple' | 'gray' | 'black'
const badgeTones: Record<Tone, string> = {
  lime: 'bg-[#D7FF45] text-black',
  orange: 'bg-[#FFE6DD] text-[#B43A16]',
  purple: 'bg-[#EEE9FF] text-[#5E49A8]',
  gray: 'bg-[#ECECE9] text-[#5F5F5A]',
  black: 'bg-black text-white',
}

export function Badge({ children, tone = 'lime', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn('inline-flex w-max items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold', badgeTones[tone], className)}>{children}</span>
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean; loading?: boolean }

export function MkButton({ children, secondary = false, loading = false, disabled, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-xs font-extrabold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50', secondary ? 'border border-black/15 bg-white text-black hover:bg-[#F2F2EF]' : 'bg-black text-white hover:bg-[#272727]', className)} {...props}>
    {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/>}
    {children}
  </button>
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('border border-black/10 bg-white', className)}>{children}</section>
}

export function Metric({ label, value, detail, icon: Icon, dark = false }: { label: string; value: string; detail?: string; icon: ElementType; dark?: boolean }) {
  return <Card className={cn('min-w-0 p-5', dark && 'bg-black text-white')}>
    <div className="flex items-start justify-between">
      <span className={cn('grid h-9 w-9 place-items-center rounded-full', dark ? 'bg-[#D7FF45] text-black' : 'bg-[#F0F0EC]')}><Icon size={16}/></span>
      <MoreHorizontal size={16} className={dark ? 'text-white/35' : 'text-black/30'} aria-hidden="true"/>
    </div>
    <p className={cn('mt-5 text-[10px] font-bold uppercase tracking-[.12em]', dark ? 'text-white/45' : 'text-black/45')}>{label}</p>
    <div className="mt-1.5 flex min-w-0 items-end justify-between gap-2">
      <p className="truncate text-[27px] font-black tracking-[-.05em]">{value}</p>
      {detail && <span className={cn('mb-1 shrink-0 text-[9px] font-extrabold', dark ? 'text-[#D7FF45]' : 'text-[#237A49]')}>{detail}</span>}
    </div>
  </Card>
}

export function MetricSkeleton({ dark = false }: { dark?: boolean }) {
  return <Card className={cn('p-5', dark && 'bg-black')}>
    <div className={cn('h-9 w-9 animate-pulse rounded-full', dark ? 'bg-white/15' : 'bg-[#ECECE8]')}/>
    <div className={cn('mt-5 h-2.5 w-24 animate-pulse', dark ? 'bg-white/15' : 'bg-[#ECECE8]')}/>
    <div className={cn('mt-3 h-7 w-28 animate-pulse', dark ? 'bg-white/15' : 'bg-[#ECECE8]')}/>
  </Card>
}

/** Page heading row: optional badge, big black title, muted line, actions on the right. */
export function PageHeading({ badge, title, subtitle, actions }: { badge?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div className="min-w-0">
      {badge && <Badge>{badge}</Badge>}
      <h2 className={cn('text-3xl font-black tracking-[-.055em]', badge && 'mt-3')}>{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-black/50">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
}

/** Filter chips (All / Live / Draft …). */
export function Chips<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <div className="flex flex-wrap gap-2" role="tablist">
    {options.map(option => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} onClick={() => onChange(option.value)} className={cn('rounded-full px-4 py-2 text-[10px] font-extrabold', value === option.value ? 'bg-black text-white' : 'border border-black/10 bg-white')}>{option.label}</button>)}
  </div>
}

/** Underlined tabs (Compose / Campaigns / …). */
export function Tabs<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: ReactNode }[]; value: T; onChange: (value: T) => void }) {
  return <div className="flex gap-1 overflow-x-auto border-b border-black/10" role="tablist">
    {options.map(option => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} onClick={() => onChange(option.value)} className={cn('shrink-0 border-b-2 px-5 py-3 text-xs font-extrabold', value === option.value ? 'border-black text-black' : 'border-transparent text-black/40')}>{option.label}</button>)}
  </div>
}

export function EmptyBlock({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center px-6 py-14 text-center">
    <p className="text-sm font-black">{title}</p>
    <p className="mt-1 max-w-sm text-xs text-black/45">{text}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
}

export function ErrorBlock({ text, onRetry }: { text: string; onRetry: () => void }) {
  return <div className="flex flex-col items-center px-6 py-12 text-center">
    <p className="text-sm font-black">Something went wrong</p>
    <p className="mt-1 max-w-sm text-xs text-black/45">{text}</p>
    <MkButton secondary onClick={onRetry} className="mt-5">Try again</MkButton>
  </div>
}

/** The design's punch-card row: filled dots up to `done`, numbers after. */
export function StampRow({ total, done, dark = false }: { total: number; done: number; dark?: boolean }) {
  const count = Math.max(1, Math.min(total || 1, 12))
  return <div className="flex flex-wrap gap-1.5">
    {Array.from({ length: count }, (_, index) => <i key={index} className={cn('grid h-7 w-7 place-items-center rounded-full border text-[9px] font-black not-italic', dark ? 'border-white' : 'border-black', index < done ? (dark ? 'bg-white text-black' : 'bg-black text-white') : '')}>{index < done ? '✓' : index + 1}</i>)}
  </div>
}

/** Field label used by the design's square inputs. */
export const inputClass = 'h-11 w-full border border-black/15 bg-white px-3 text-xs outline-none focus:border-black'
export const labelClass = 'text-[10px] font-extrabold uppercase tracking-wider text-black/45'

export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '·'
