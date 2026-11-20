import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { errorMessage } from '@/api/auth'
import { useJoinProgram, usePublicProgram, type JoinInput } from '@/api/loyalty'
import { LoyaltyCardSkeleton } from '@/components/ui/CardSkeleton'
import { DateRangeFilter, fromApiDate, toApiDate } from '@/components/ui/DateRangeFilter'
import { Logo } from '@/components/ui/Logo'
import { MkButton, inputClass } from '@/components/ui/mk'
import { isDarkColour, resolveCardColour } from '@/api/storeTheme'
import { cn } from '@/lib/cn'
import { cardPath } from '@/routes/paths'

/**
 * Public: the page behind a programme's QR. Shows the programme and signs the customer up
 * (POST loyalty/join/{token}/), as sink's join page.
 */
export default function JoinPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const program = usePublicProgram(token)
  const join = useJoinProgram()
  const [form, setForm] = useState<JoinInput>({ fullName: '', phone: '', email: '', birthday: '', address: '' })
  const [error, setError] = useState('')
  const set = (key: keyof JoinInput) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [key]: event.target.value }))
  const p = program.data
  // The business's store colour, as sink's join page themes it (store_theme on the public programme).
  const colour = resolveCardColour(p?.storeTheme ?? '')
  const dark = isDarkColour(colour)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.fullName.trim()) return setError('Please enter your full name.')
    if (!form.phone.trim()) return setError('Please enter your phone number.')
    setError('')
    join.mutate({ token, input: form }, {
      // The card link carries the programme (?p=), so the card shows the business's name and colour.
      onSuccess: result => { if (result.loyaltyCode) navigate(`${cardPath(result.loyaltyCode)}?p=${encodeURIComponent(token)}`, { replace: true }) },
      onError: failure => setError(errorMessage(failure, 'Could not join. Please try again.')),
    })
  }

  return <div className="min-h-[100dvh] bg-[#F6F6F2] px-4 py-8">
    <div className="mx-auto max-w-sm">
      <div className="mb-6 flex justify-center"><Logo/></div>
      {program.isLoading ? <LoyaltyCardSkeleton/>
        : !p ? <div className="border border-black/10 bg-white p-6 text-center"><p className="text-sm font-black">This program isn’t available</p><p className="mt-1 text-xs text-black/45">Ask the business for a new QR code.</p></div>
          : <>
            <div className={cn('rounded-[26px] p-6', dark && 'text-white')} style={{ background: colour }}>
              <div className="flex items-center gap-3">{p.businessLogo ? <img src={p.businessLogo} alt="" className="h-10 w-10 rounded-full object-cover"/> : <span className={cn('grid h-10 w-10 place-items-center rounded-full text-xs font-black', dark ? 'bg-white text-black' : 'bg-black text-white')}>{p.businessName.slice(0, 2).toUpperCase()}</span>}<b className="text-xs uppercase">{p.businessName}</b></div>
              <h1 className="mt-8 text-3xl font-black leading-tight tracking-[-.05em]">{p.name}.</h1>
              <p className="mt-3 text-xs font-bold opacity-70">{p.description || [p.triggerSummary, p.rewardSummary].filter(Boolean).join(' · ')}</p>
            </div>
            <form onSubmit={submit} className="mt-5 space-y-3 border border-black/10 bg-white p-5">
              <p className="text-sm font-black">Join and get your card</p>
              <input value={form.fullName} onChange={set('fullName')} autoComplete="name" maxLength={200} placeholder="Full name" className={inputClass}/>
              <input value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" maxLength={15} autoComplete="tel" placeholder="Phone number" className={inputClass}/>
              <input value={form.email} onChange={set('email')} type="email" autoComplete="email" placeholder="Email (optional)" className={inputClass}/>
              <input value={form.address} onChange={set('address')} autoComplete="street-address" placeholder="Address (optional)" className={inputClass}/>
              <div><span className="block text-[10px] font-bold text-black/45">Birthday (optional)</span><DateRangeFilter singleDay yearJump max={new Date()} value={form.birthday ? { from: fromApiDate(form.birthday), to: fromApiDate(form.birthday) } : undefined} onChange={next => setForm(current => ({ ...current, birthday: toApiDate(next?.from) }))} placeholder="Pick your birthday" align="start" className="mt-1 w-full" triggerClassName="h-11 rounded-none border-black/15"/></div>
              {error && <p role="alert" className="bg-[#FFE6DD] px-3 py-2 text-xs font-bold text-[#B43A16]">{error}</p>}
              <MkButton type="submit" loading={join.isPending} className="w-full">Join {p.name}</MkButton>
            </form>
          </>}
    </div>
  </div>
}
