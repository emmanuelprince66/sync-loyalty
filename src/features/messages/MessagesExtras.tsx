import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, PenLine, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useAudiences, useDeleteCampaign, useDeleteGroup, useSaveGroup, useSaveSenderId, useSenderId, useUpdateCampaign, type Campaign, type Group } from '@/api/campaigns'
import { useCustomerSearch } from '@/api/customers'
import { Badge, Card, EmptyBlock, MkButton, inputClass, labelClass } from '@/components/ui/mk'
import { cn } from '@/lib/cn'
import { TableSkeleton } from '@/components/ui/TableSkeleton'

function Sheet({ title, kicker, onClose, children, footer }: { title: string; kicker: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return <Dialog.Root open onOpenChange={next => { if (!next) onClose() }}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-0 sm:p-4"><Dialog.Content aria-describedby={undefined} className="flex max-h-[100dvh] w-full max-w-xl flex-col bg-[#F6F6F2] shadow-2xl outline-none sm:max-h-[92vh]">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-6 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">{kicker}</p><Dialog.Title className="text-xl font-black">{title}</Dialog.Title></div><button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><X size={16}/></button></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      <div className="flex justify-end gap-2 border-t border-black/10 px-6 py-4">{footer}</div>
    </Dialog.Content></Dialog.Overlay></Dialog.Portal>
  </Dialog.Root>
}

// ─── Groups ───────────────────────────────────────────────────────────────

function GroupEditor({ group, onClose }: { group: Group | 'new'; onClose: () => void }) {
  const existing = group === 'new' ? null : group
  const save = useSaveGroup()
  const [name, setName] = useState(existing?.name ?? '')
  const [members, setMembers] = useState(existing?.members ?? [])
  const [query, setQuery] = useState('')
  const search = useCustomerSearch(query)
  const picked = new Set(members.map(member => member.id))
  const toggle = (customer: { id: string; name: string; phone: string }) => setMembers(current => (picked.has(customer.id) ? current.filter(item => item.id !== customer.id) : [...current, customer]))

  const submit = () => {
    if (!name.trim()) return toast.error('Name the group.')
    if (members.length === 0) return toast.error('Please select at least one customer.')
    save.mutate({ id: existing?.id, input: { name, customerIds: members.map(member => member.id) } }, {
      onSuccess: () => { toast.success(existing ? 'Group updated' : 'Group created'); onClose() },
      onError: error => toast.error(errorMessage(error, 'Could not save the group.')),
    })
  }

  return <Sheet kicker="Messages" title={existing ? 'Edit group' : 'New group'} onClose={onClose} footer={<><MkButton secondary onClick={onClose}>Cancel</MkButton><MkButton onClick={submit} loading={save.isPending}>{existing ? 'Save changes' : 'Create group'}</MkButton></>}>
    <div className="space-y-5">
      <label className="block"><span className={labelClass}>Group name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Office regulars" className={cn(inputClass, 'mt-2')}/></label>
      <div>
        <span className={labelClass}>Add customers</span>
        <label className="mt-2 flex h-11 items-center gap-2 border border-black/15 bg-white px-3 focus-within:border-black"><Search size={14} className="text-black/40"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or phone (3+ letters)" className="w-full bg-transparent text-xs outline-none"/></label>
        {search.search && <div className="mt-2 max-h-48 divide-y divide-black/10 overflow-y-auto border border-black/10 bg-white">
          {search.isLoading ? <p className="p-3 text-[11px] text-black/40">Searching…</p>
            : search.customers.length === 0 ? <p className="p-3 text-[11px] text-black/40">No customers match.</p>
              : search.customers.map(customer => <button key={customer.id} type="button" onClick={() => toggle({ id: customer.id, name: customer.name, phone: customer.phone })} className={cn('flex w-full items-center justify-between gap-3 p-3 text-left text-xs', picked.has(customer.id) ? 'bg-[#D7FF45]' : 'hover:bg-[#F6F6F2]')}><span className="min-w-0"><b className="block truncate">{customer.name}</b><span className="text-[10px] text-black/45">{customer.phone}</span></span>{picked.has(customer.id) && <Check size={14}/>}</button>)}
        </div>}
      </div>
      <div>
        <p className={labelClass}>In this group ({members.length})</p>
        {members.length === 0 ? <p className="mt-2 text-[11px] text-black/45">Nobody yet. Search above to add customers.</p>
          : <div className="mt-2 flex flex-wrap gap-1.5">{members.map(member => <span key={member.id} className="inline-flex items-center gap-1.5 rounded-full bg-black py-1 pl-3 pr-1 text-[11px] font-bold text-white">{member.name}<button type="button" aria-label={`Remove ${member.name}`} onClick={() => toggle(member)} className="grid h-5 w-5 place-items-center rounded-full bg-white/15"><X size={11}/></button></span>)}</div>}
      </div>
    </div>
  </Sheet>
}

export function GroupsTab({ canManage }: { canManage: boolean }) {
  const audiences = useAudiences()
  const remove = useDeleteGroup()
  const [editing, setEditing] = useState<Group | 'new' | null>(null)
  return <Card className="overflow-hidden">
    <div className="flex items-center justify-between gap-3 border-b border-black/10 p-5"><div><h3 className="text-sm font-black">Customer groups</h3><p className="mt-1 text-[11px] text-black/45">Hand-picked lists you can message in one go</p></div>{canManage && <MkButton onClick={() => setEditing('new')}><Plus size={14}/>New group</MkButton>}</div>
    {audiences.groupsLoading ? <TableSkeleton header={false} rows={3} columns={[{ thumbnail: true, flex: true, twoLine: true }, { width: 'w-20', alignRight: true }]}/>
      : audiences.groups.length === 0 ? <EmptyBlock title="No groups yet" text="Group customers you want to message together, like staff or office regulars."/>
        : audiences.groups.map(group => <div key={group.id} className="flex items-center justify-between gap-3 border-b border-black/10 p-4 last:border-0">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F0F0EC]"><Users size={15}/></span><div className="min-w-0"><b className="block truncate text-xs">{group.name}</b><span className="text-[10px] text-black/45">{group.count.toLocaleString()} customers</span></div></div>
          {canManage && <div className="flex shrink-0 gap-1.5"><button type="button" aria-label={`Edit ${group.name}`} onClick={() => setEditing(group)} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 hover:border-black"><PenLine size={13}/></button><button type="button" aria-label={`Delete ${group.name}`} disabled={remove.isPending} onClick={() => remove.mutate(group.id, { onSuccess: () => toast.success('Group deleted'), onError: error => toast.error(errorMessage(error, 'Could not delete the group.')) })} className="grid h-9 w-9 place-items-center rounded-full border border-black/10 hover:border-[#B43A16] disabled:opacity-50"><Trash2 size={13}/></button></div>}
        </div>)}
    {editing && <GroupEditor group={editing} onClose={() => setEditing(null)}/>}
  </Card>
}

// ─── Campaign edit / delete ───────────────────────────────────────────────

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const update = useUpdateCampaign()
  const remove = useDeleteCampaign()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState({ name: campaign.name, title: campaign.title, message: campaign.message })
  return <>
    <div className="flex shrink-0 gap-1.5">
      <button type="button" aria-label={`Edit ${campaign.name}`} onClick={() => { setForm({ name: campaign.name, title: campaign.title, message: campaign.message }); setEditing(true) }} className="grid h-8 w-8 place-items-center rounded-full border border-black/10 hover:border-black"><PenLine size={13}/></button>
      <button type="button" aria-label={`Delete ${campaign.name}`} onClick={() => setConfirming(true)} className="grid h-8 w-8 place-items-center rounded-full border border-black/10 hover:border-[#B43A16]"><Trash2 size={13}/></button>
    </div>
    {editing && <Sheet kicker="Campaign" title="Edit campaign" onClose={() => setEditing(false)} footer={<><MkButton secondary onClick={() => setEditing(false)}>Cancel</MkButton><MkButton loading={update.isPending} onClick={() => {
      if (!form.name.trim() || !form.message.trim()) return toast.error('Add a name and a message.')
      update.mutate({ id: campaign.id, input: form }, { onSuccess: () => { toast.success('Campaign updated'); setEditing(false) }, onError: error => toast.error(errorMessage(error, 'Could not update the campaign.')) })
    }}>Save changes</MkButton></>}>
      <div className="space-y-4">
        <label className="block"><span className={labelClass}>Name</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={cn(inputClass, 'mt-2')}/></label>
        {campaign.channel === 'EMAIL' && <label className="block"><span className={labelClass}>Subject</span><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className={cn(inputClass, 'mt-2')}/></label>}
        <label className="block"><span className={labelClass}>Message</span><textarea value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} className="mt-2 h-36 w-full resize-none border border-black/15 bg-white p-3 text-xs outline-none focus:border-black"/></label>
      </div>
    </Sheet>}
    {confirming && <Sheet kicker="Campaign" title="Delete this campaign?" onClose={() => setConfirming(false)} footer={<><MkButton secondary onClick={() => setConfirming(false)}>Keep it</MkButton><MkButton loading={remove.isPending} className="!bg-[#B43A16]" onClick={() => remove.mutate(campaign.id, { onSuccess: () => { toast.success('Campaign deleted'); setConfirming(false) }, onError: error => toast.error(errorMessage(error, 'Could not delete the campaign.')) })}>Delete</MkButton></>}>
      <p className="text-sm text-black/60">“{campaign.name}” will be removed from your list. Messages already delivered stay delivered.</p>
    </Sheet>}
  </>
}

// ─── Sender ID ────────────────────────────────────────────────────────────

/** sink's Add Sender ID: the name SMS arrive from. Up to 11 letters or numbers. */
export function SenderIdCard({ canManage }: { canManage: boolean }) {
  const sender = useSenderId()
  const save = useSaveSenderId()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const current = sender.data ?? ''
  return <Card className="p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-black/40">SMS sender ID</p><p className="mt-2 text-xl font-black tracking-[-.03em]">{sender.isLoading ? '—' : current || 'Not set'}</p><p className="mt-1 text-[11px] text-black/45">The name your SMS arrive from.</p></div>{current ? <Badge>Active</Badge> : <Badge tone="orange">Needed</Badge>}</div>
    {canManage && (open
      ? <div className="mt-4 flex gap-2"><input value={value} maxLength={11} onChange={event => setValue(event.target.value.replace(/[^a-zA-Z0-9]/g, ''))} placeholder="e.g. MAHELE" className={inputClass} aria-label="Sender ID"/><MkButton loading={save.isPending} onClick={() => {
        if (value.length < 3) return toast.error('Use 3 to 11 letters or numbers.')
        save.mutate(value, { onSuccess: () => { toast.success('Sender ID submitted'); setOpen(false) }, onError: error => toast.error(errorMessage(error, 'Could not save the sender ID.')) })
      }}>Save</MkButton></div>
      : <MkButton secondary className="mt-4" onClick={() => { setValue(current); setOpen(true) }}>{current ? 'Change sender ID' : 'Add sender ID'}</MkButton>)}
  </Card>
}
