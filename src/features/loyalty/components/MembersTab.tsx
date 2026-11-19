import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useLoyaltyMembers } from '@/api/loyalty'
import { Badge, Card, EmptyBlock, ErrorBlock, initialsOf } from '@/components/ui/mk'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useFormatMoney } from '@/hooks/useFormatMoney'

const birthdayLabel = (value: string) => {
  const match = /^(?:\d{4}-)?(\d{2})-(\d{2})/.exec(value)
  return match ? new Date(2000, Number(match[1]) - 1, Number(match[2])).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
}

/** sink's LoyaltyMembers: everyone in a programme (GET loyalty/members/{business_id}/), searchable by name, phone or referral code. */
export function MembersTab() {
  const money = useFormatMoney()
  const members = useLoyaltyMembers()
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const rows = useMemo(() => (members.data ?? []).filter(member => !term || [member.name, member.phone, member.referralCode].some(value => value.toLowerCase().includes(term))), [members.data, term])

  return <Card className="overflow-hidden">
    <div className="flex flex-col justify-between gap-3 border-b border-black/10 p-4 sm:flex-row sm:items-center sm:p-5">
      <div><h3 className="text-sm font-black">Members</h3><p className="mt-1 text-[11px] text-black/45">{members.isLoading ? 'Loading…' : `${(members.data ?? []).length.toLocaleString()} in your programs`}</p></div>
      <label className="flex h-10 w-full items-center gap-2 rounded-full bg-[#F1F1ED] px-4 sm:w-72"><Search size={14} className="shrink-0 text-black/45"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, phone or referral code" aria-label="Search members" className="w-full bg-transparent text-xs outline-none"/></label>
    </div>
    {members.isError ? <ErrorBlock text="We couldn’t load your members." onRetry={() => { void members.refetch() }}/>
      : members.isLoading ? <TableSkeleton rows={6} columns={[{ thumbnail: true, flex: true, twoLine: true }, { pill: true, hiddenOnMobile: true }, { width: 'w-12', hiddenOnMobile: true }, { width: 'w-20' }, { width: 'w-16', hiddenOnMobile: true }]}/>
        : rows.length === 0 ? <EmptyBlock title={term ? 'No matches' : 'No members yet'} text={term ? `Nobody matches “${query}”.` : 'Members appear here once customers join a program.'}/>
          : <>
            {/* Phones: one card per member */}
            <div className="divide-y divide-black/10 md:hidden">{rows.map(member => <div key={member.id || member.referralCode} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F0F0EC] text-[11px] font-black">{initialsOf(member.name)}</span>
              <div className="min-w-0 flex-1"><b className="block truncate text-sm">{member.name}</b><span className="block truncate text-[11px] text-black/45">{[member.phone, member.referralCode].filter(Boolean).join(' · ')}</span><span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-black/55">{member.tier && <Badge tone="gray">{member.tier}</Badge>}{member.visits} visits{member.birthday && ` · 🎂 ${birthdayLabel(member.birthday)}`}</span></div>
              <b className="shrink-0 text-xs">{money(member.spend)}</b>
            </div>)}</div>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[#F7F7F4] text-[10px] uppercase tracking-wider text-black/45"><tr><th className="px-5 py-3">Member</th><th>Tier</th><th>Visits</th><th>Lifetime spend</th><th>Birthday</th><th className="pr-5">Referral code</th></tr></thead>
              <tbody>{rows.map(member => <tr key={member.id || member.referralCode} className="border-t border-black/10">
                <td className="px-5 py-3"><span className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F0F0EC] text-[10px] font-black">{initialsOf(member.name)}</span><span className="min-w-0"><b className="block truncate">{member.name}</b><span className="text-[10px] text-black/45">{member.phone}</span></span></span></td>
                <td>{member.tier ? <Badge tone="gray">{member.tier}</Badge> : '—'}</td>
                <td className="font-black">{member.visits}</td>
                <td className="font-black">{money(member.spend)}</td>
                <td>{birthdayLabel(member.birthday) || '—'}</td>
                <td className="pr-5 font-mono text-[11px]">{member.referralCode || '—'}</td>
              </tr>)}</tbody>
            </table></div>
          </>}
  </Card>
}
