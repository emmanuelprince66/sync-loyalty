import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

/** maheleKart logo from the loyalty design: lime star badge + wordmark. `inverse` is for dark backgrounds. */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <div className="flex items-center gap-2.5">
    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#D7FF45] text-black"><Star size={17} fill="currentColor"/></span>
    <span className={cn('text-lg font-black tracking-[-0.05em]', inverse ? 'text-white' : 'text-black')}>mahele<span className={inverse ? 'text-[#D7FF45]' : 'text-black/45'}>kart</span></span>
  </div>
}
