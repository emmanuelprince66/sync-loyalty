import { cn } from '@/lib/cn'

const Bar = ({ className, dark }: { className?: string; dark?: boolean }) => <span className={cn('block animate-pulse', dark ? 'bg-white/15' : 'bg-[#ECECE8]', className)}/>

/**
 * One item card while it loads, shaped like the real ones: a title row with a badge, a big figure,
 * a caption, and an optional footer of small stats. Pairs with sink's CardGridSkeleton below.
 */
export function CardSkeleton({ footer = 3, avatar = false, dark = false, className }: { footer?: number; avatar?: boolean; dark?: boolean; className?: string }) {
  return <div className={cn('p-5', dark ? 'bg-black' : 'border border-black/10 bg-white', className)} role="status" aria-label="Loading">
    <div className="flex items-start justify-between gap-3">
      <span className="flex min-w-0 flex-1 items-center gap-3">{avatar && <Bar dark={dark} className="h-10 w-10 shrink-0 rounded-full"/>}<Bar dark={dark} className="h-3.5 w-2/3"/></span>
      <Bar dark={dark} className="h-5 w-12 shrink-0 rounded-full"/>
    </div>
    <Bar dark={dark} className="mt-5 h-8 w-24"/>
    <Bar dark={dark} className="mt-2.5 h-2.5 w-1/2"/>
    {footer > 0 && <div className={cn('mt-5 grid gap-3 border-t pt-4', dark ? 'border-white/10' : 'border-black/10')} style={{ gridTemplateColumns: `repeat(${footer}, minmax(0, 1fr))` }}>
      {Array.from({ length: footer }, (_, index) => <span key={index} className="space-y-1.5"><Bar dark={dark} className="h-4 w-10"/><Bar dark={dark} className="h-2 w-14"/></span>)}
    </div>}
    <span className="sr-only">Loading</span>
  </div>
}

/** sink's CardGridSkeleton: `count` card skeletons in the same grid the real cards use. */
export function CardGridSkeleton({ count = 6, gridClassName = 'grid gap-3 sm:grid-cols-2', footer, avatar, firstDark = false, cardClassName }: { count?: number; gridClassName?: string; footer?: number; avatar?: boolean; firstDark?: boolean; cardClassName?: string }) {
  return <div className={gridClassName}>{Array.from({ length: count }, (_, index) => <CardSkeleton key={index} footer={footer} avatar={avatar} dark={firstDark && index === 0} className={cardClassName}/>)}</div>
}

/** The member's loyalty card while it loads: same rounded shape, stamp row and QR footer. */
export function LoyaltyCardSkeleton({ className }: { className?: string }) {
  return <div className={cn('overflow-hidden rounded-[26px] bg-[#E9F6B8]', className)} role="status" aria-label="Loading">
    <div className="p-6">
      <div className="flex items-center justify-between"><Bar className="h-10 w-10 rounded-full !bg-black/10"/><Bar className="h-2.5 w-24 !bg-black/10"/></div>
      <Bar className="mt-9 h-2.5 w-28 !bg-black/10"/>
      <Bar className="mt-3 h-7 w-44 !bg-black/10"/>
      <div className="mt-7 flex gap-1.5">{Array.from({ length: 7 }, (_, index) => <Bar key={index} className="h-7 w-7 rounded-full !bg-black/10"/>)}</div>
    </div>
    <div className="flex items-center justify-between bg-white p-4"><span className="space-y-2"><Bar className="h-3 w-28"/><Bar className="h-2.5 w-20"/></span><Bar className="h-[72px] w-[72px]"/></div>
    <span className="sr-only">Loading</span>
  </div>
}
