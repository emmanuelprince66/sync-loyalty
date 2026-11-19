import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { AUTOMATION_TYPES, MIN_FUND_AMOUNT, useAudiences, useAutomations, useCampaigns, useCreateCampaign, useCreditUsage, useCredits, useEstimate, useFundCredits, useSaveAutomations, type Automation, type AutomationType, type Channel } from '@/api/campaigns'
import { usePermissions } from '@/hooks/usePermissions'
import { useBusinessDataStore } from '@/stores/business-data-store'

export type MessagesTab = 'compose' | 'campaigns' | 'groups' | 'automations' | 'credits'

export const TEMPLATES: [string, string][] = [
  ['Happy new month', 'Happy new month! Thank you for being part of {{business_name}}. Visit us this week and earn double loyalty points.'],
  ['Reward reminder', 'You’re almost there, {{first_name}}! One more visit unlocks your free reward at {{business_name}}.'],
  ['We miss you', 'It’s been a while, {{first_name}}. Come back this week and enjoy a little reward from us.'],
]

export const PLACEHOLDERS = [['First name', '{{first_name}}'], ['Business name', '{{business_name}}']] as const

/** SMS / email campaigns, automations and credits (campaign/* endpoints, as sink-inventory's Campaign screens). */
export function useMessages() {
  const { canSendMessages, canBuyCredits } = usePermissions()
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'your business'
  const [tab, setTab] = useState<MessagesTab>('compose')

  // ─── Compose ────────────────────────────────────────────────────────────
  const [channel, setChannel] = useState<Channel>('SMS')
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState(TEMPLATES[0][1])
  const [params] = useSearchParams()
  // Opened from a segment (Message this segment): start with that audience.
  const [audience, setAudience] = useState(() => (params.get('segment') ? 's:' + params.get('segment') : 'all'))
  const audiences = useAudiences()
  const estimate = useEstimate()
  const create = useCreateCampaign()
  const credits = useCredits()
  const usage = useCreditUsage()
  const campaigns = useCampaigns()

  const audienceInput = audience === 'all' ? { sendToAll: true, groupIds: [], segmentIds: [] }
    : audience.startsWith('g:') ? { sendToAll: false, groupIds: [audience.slice(2)], segmentIds: [] }
      : { sendToAll: false, groupIds: [], segmentIds: [audience.slice(2)] }
  const { mutate: runEstimate } = estimate
  const estimateKey = `${channel}|${audience}`
  // Ask the backend who this reaches and what it costs whenever the audience or channel changes (sink's CreditEstimate).
  useEffect(() => {
    const timer = setTimeout(() => runEstimate({ channel, audience: audienceInput }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- estimateKey covers channel and audience
  }, [estimateKey, runEstimate])

  const smsParts = Math.max(1, Math.ceil(message.length / 160))
  const needed = estimate.data?.credits ?? 0
  const balance = credits.data?.balance ?? 0
  const notEnough = estimate.data ? !estimate.data.sufficient : false

  const send = () => {
    if (!name.trim()) return toast.error('Give this message a name so you can find it later.')
    if (!message.trim()) return toast.error('Write your message first.')
    if (channel === 'EMAIL' && !subject.trim()) return toast.error('Add an email subject line.')
    if (notEnough) return toast.error('You don’t have enough credits for this send. Buy more credits first.')
    create.mutate({ name, channel, title: subject, message, audience: audienceInput }, {
      onSuccess: () => { toast.success('Message queued for sending'); setName(''); setTab('campaigns') },
      onError: error => toast.error(errorMessage(error, 'Could not send the message.')),
    })
  }

  // ─── Automations ────────────────────────────────────────────────────────
  const automations = useAutomations()
  const saveAutomation = useSaveAutomations()
  const [editing, setEditing] = useState<Automation | null>(null)
  const automationRows = AUTOMATION_TYPES.map(item => {
    const saved = automations.data?.find(row => row.type === item.type)
    return { ...item, active: saved?.active ?? false, channel: saved?.channel ?? 'SMS', message: saved?.message ?? '' }
  })
  // sink saves the whole automation list in one request, so the changed row is merged into the rest.
  const persist = (row: Automation, done?: () => void) => saveAutomation.mutate(automationRows.map(item => (item.type === row.type ? row : { type: item.type, message: item.message, channel: item.channel, active: item.active })).filter(item => item.message.trim()), {
    onSuccess: () => { toast.success(row.active ? 'Automation is on' : 'Automation is off'); done?.() },
    onError: error => toast.error(errorMessage(error, 'Could not save the automation.')),
  })

  // ─── Credits ────────────────────────────────────────────────────────────
  const fund = useFundCredits()
  const [buying, setBuying] = useState(false)

  return {
    tab, setTab,
    canSend: canSendMessages,
    canBuy: canBuyCredits,
    businessName,
    // compose
    channel, setChannel,
    name, setName,
    subject, setSubject,
    message, setMessage,
    insert: (token: string) => setMessage(current => `${current}${current.endsWith(' ') || !current ? '' : ' '}${token}`),
    audience, setAudience,
    audienceOptions: [
      { value: 'all', label: 'All customers' },
      ...audiences.segments.map(segment => ({ value: `s:${segment.id}`, label: `${segment.name}${segment.count ? ` (${segment.count.toLocaleString()})` : ''}` })),
      ...audiences.groups.map(group => ({ value: `g:${group.id}`, label: `Group: ${group.name}${group.count ? ` (${group.count.toLocaleString()})` : ''}` })),
    ],
    recipients: estimate.data?.recipients ?? 0,
    unreachable: estimate.data?.unreachable ?? 0,
    estimating: estimate.isPending,
    needed,
    smsParts,
    notEnough,
    sending: create.isPending,
    send,
    preview: message.replace(/\{\{first_name\}\}/g, 'Amara').replace(/\{\{business_name\}\}/g, businessName),
    // campaigns
    campaigns: campaigns.data ?? [],
    campaignsLoading: campaigns.isLoading,
    // automations
    automationRows,
    automationsLoading: automations.isLoading,
    savingAutomation: saveAutomation.isPending,
    toggleAutomation: (type: AutomationType) => {
      const row = automationRows.find(item => item.type === type)
      if (!row) return
      if (!row.message) return setEditing({ type, message: '', channel: row.channel, active: true })
      persist({ type, message: row.message, channel: row.channel, active: !row.active })
    },
    editing,
    editAutomation: (type: AutomationType) => {
      const row = automationRows.find(item => item.type === type)
      if (row) setEditing({ type, message: row.message, channel: row.channel, active: row.active || !row.message })
    },
    updateEditing: (patch: Partial<Automation>) => setEditing(current => (current ? { ...current, ...patch } : current)),
    closeEditing: () => setEditing(null),
    saveEditing: () => {
      if (!editing) return
      if (!editing.message.trim()) return toast.error('Write the message this automation sends.')
      persist(editing, () => setEditing(null))
    },
    // credits
    balance,
    usedThisMonth: credits.data?.usedThisMonth ?? 0,
    creditsLoading: credits.isLoading,
    usage: usage.data ?? [],
    usageLoading: usage.isLoading,
    buying,
    openBuy: () => setBuying(true),
    closeBuy: () => setBuying(false),
    funding: fund.isPending,
    /** As sink's FundMessageCredits: start the purchase, then send the user to the payment page it returns. */
    buy: (naira: number) => {
      if (naira < MIN_FUND_AMOUNT) return toast.error(`Enter at least ₦${MIN_FUND_AMOUNT}.`)
      fund.mutate(naira, {
        onSuccess: ({ paymentUrl, message }) => { toast.success(message || 'Taking you to payment…'); window.location.href = paymentUrl },
        onError: error => toast.error(errorMessage(error, 'Could not start the payment.')),
      })
    },
  }
}

export type MessagesModel = ReturnType<typeof useMessages>
