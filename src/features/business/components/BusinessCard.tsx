import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import type { BusinessCardModel } from '../hooks/useSelectBusinessPage'

/** One business in the picker. The whole card is the button. */
export function BusinessCard({ card, onSelect }: { card: BusinessCardModel; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={cn('group flex w-full min-w-0 items-center gap-3 sm:gap-4 rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#000000] hover:shadow-[0_14px_34px_rgba(30,30,30,.08)] sm:p-5', card.isCurrent ? 'border-[#000000] ring-4 ring-[#000000]/10' : 'border-[#E3E3DF]')}>
    {card.business.logo
      ? <img src={card.business.logo} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-[#E3E3DF] object-cover"/>
      : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F0EC] text-sm font-black text-[#000000]">{card.initials}</span>}
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2">
        <span className="truncate text-sm font-extrabold text-[#000000]">{card.name}</span>
        {card.isCurrent && <span className="shrink-0 rounded-full bg-[#F0F0EC] px-2 py-0.5 text-[9px] font-extrabold text-[#000000]">Current</span>}
      </span>
      <span className="mt-1 block truncate text-[11px] text-[#66665F]">{card.address}</span>
      {card.type && <span className="mt-2 inline-flex rounded-full bg-[#ECECE8] px-2 py-0.5 text-[9px] font-bold text-[#66665F]">{card.type}</span>}
    </span>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#66665F] transition group-hover:bg-[#F0F0EC] group-hover:text-[#000000]"><Icon name="arrow" size={16}/></span>
  </button>
}

/** Dashed "Create a new business" tile at the end of the list. */
export function CreateBusinessTile({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#CFCFC9] bg-[#F6F6F2] p-4 text-left transition hover:border-[#000000] hover:bg-white sm:p-5">
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#000000] shadow-sm"><Icon name="plus" size={20}/></span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-extrabold text-[#000000]">Create a new business</span>
      <span className="mt-1 block text-[11px] text-[#66665F]">Add another store or brand to your account</span>
    </span>
  </button>
}
