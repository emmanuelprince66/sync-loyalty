import { cn } from '@/lib/cn'

export type TableSkeletonColumn = {
  /** Tailwind width class for this column's bar, e.g. "w-32". Ignored when `flex` is set. */
  width?: string
  /** Grow to fill the remaining space: the name column. */
  flex?: boolean
  /** Hidden below `sm`, like the real responsive tables. */
  hiddenOnMobile?: boolean
  /** A round avatar before the bar, for name columns. */
  thumbnail?: boolean
  /** A pill instead of a bar, for status columns. */
  pill?: boolean
  /** Right-aligned, for amounts and actions. */
  alignRight?: boolean
  /** A second, shorter line under the bar (name + phone, title + detail). */
  twoLine?: boolean
}

const Bar = ({ className }: { className?: string }) => <span className={cn('block animate-pulse bg-[#ECECE8]', className)}/>

/**
 * sink-inventory's TableSkeleton: a header row plus rows shaped like the real cells (avatars, pills,
 * amounts), so the table keeps its shape and nothing jumps when the data lands.
 */
export function TableSkeleton({ columns, rows = 6, header = true, className }: { columns: TableSkeletonColumn[]; rows?: number; header?: boolean; className?: string }) {
  return <div className={cn('w-full', className)} role="status" aria-label="Loading">
    {header && <div className="hidden items-center gap-4 bg-[#F7F7F4] px-5 py-3.5 md:flex">
      {columns.map((column, index) => <Bar key={index} className={cn('h-2.5', column.flex ? 'flex-1' : column.width ?? 'w-16', column.hiddenOnMobile && 'hidden sm:block', column.alignRight && 'ml-auto')}/>)}
    </div>}
    <div className="divide-y divide-black/10">
      {Array.from({ length: rows }, (_, row) => <div key={row} className="flex items-center gap-4 px-5 py-4">
        {columns.map((column, index) => <div key={index} className={cn('flex min-w-0 items-center gap-3', column.flex ? 'flex-1' : 'shrink-0', column.hiddenOnMobile && 'hidden sm:flex', column.alignRight && 'ml-auto justify-end')}>
          {column.thumbnail && <Bar className="h-10 w-10 shrink-0 rounded-full"/>}
          {column.pill
            ? <Bar className="h-6 w-16 rounded-full"/>
            : <span className={cn('flex min-w-0 flex-col gap-2', column.flex ? 'flex-1' : column.width ?? 'w-16')}>
              <Bar className="h-3 w-full"/>
              {column.twoLine && <Bar className="h-2.5 w-2/3"/>}
            </span>}
        </div>)}
      </div>)}
    </div>
    <span className="sr-only">Loading</span>
  </div>
}
