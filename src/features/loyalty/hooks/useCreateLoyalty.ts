import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateProgram, useRewardItems, type ProgramInput, type RewardType, type RuleMode } from '@/api/loyalty'
import { useCardColour, useSaveCardColour } from '@/api/storeTheme'
import { useDebounce } from '@/hooks/useDebounce'
import { programPath } from '@/routes/paths'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { useUiStore } from '@/stores/ui-store'

/** The options below are sink-inventory's Create Loyalty wizard (wizard/config.ts), in the design's wording. */

export const GOALS = [
  { value: 'visits', label: 'Increase visits', detail: 'Turn occasional customers into regulars', mode: 'VISIT' as RuleMode },
  { value: 'revenue', label: 'Grow revenue', detail: 'Encourage customers to spend more', mode: 'SPEND' as RuleMode },
  { value: 'streak', label: 'Build a streak', detail: 'Create a repeat-visit habit', mode: 'VISIT' as RuleMode },
  { value: 'vip', label: 'Reward VIPs', detail: 'Recognise your best customers', mode: 'BOTH' as RuleMode },
] as const
export type Goal = typeof GOALS[number]['value']

export const MECHANICS: { value: RuleMode; label: string }[] = [
  { value: 'VISIT', label: 'Visit streak' },
  { value: 'SPEND', label: 'Spend target' },
  { value: 'BOTH', label: 'Visits + spend' },
]

export const REWARDS: { value: RewardType; label: string; hint: string }[] = [
  { value: 'FREE_ITEM', label: 'Free product', hint: 'Pick the product' },
  { value: 'FREE_SERVICE', label: 'Free service', hint: 'Pick the service' },
  { value: 'PERCENTAGE', label: 'Discount', hint: '% off' },
  { value: 'WALLET_CREDIT', label: 'Cash credit', hint: '₦ to wallet' },
  { value: 'POINTS', label: 'Points bonus', hint: 'points' },
]

/** sink's TIME_LIMITS: how long a member has to finish. -1 = custom. */
export const TIME_LIMITS = [
  { value: 0, label: 'No time limit' },
  { value: 7, label: 'Within 7 days' },
  { value: 30, label: 'Within 30 days' },
  { value: 60, label: 'Within 60 days' },
  { value: -1, label: 'Custom' },
]

/** sink's VISIT_WINDOWS: the gap before another sale counts as a new visit. -1 = custom. */
export const VISIT_WINDOWS = [
  { value: 0, label: 'Every sale counts', detail: 'No gap needed' },
  { value: 12, label: 'Every 12 hours', detail: 'Morning and evening count' },
  { value: 24, label: 'Once a day', detail: 'The usual choice' },
  { value: 168, label: 'Once a week', detail: 'Week-on-week habits' },
  { value: -1, label: 'Custom', detail: 'Your own hours' },
]

/** sink's TIMEOUT_ACTIONS: what happens when the time limit runs out. */
export const TIMEOUT_ACTIONS: { value: ProgramInput['timeoutAction']; label: string; detail: string }[] = [
  { value: 'RESTART', label: 'Restart from zero', detail: 'They start fresh from visit 1' },
  { value: 'PAUSE', label: 'Pause progress', detail: 'Saved and resumes on their next visit' },
  { value: 'EXPIRE', label: 'End the program', detail: 'The program ends for that customer' },
]

/** sink's STYLES. */
export const STYLES: { value: ProgramInput['rewardStyle']; label: string; detail: string }[] = [
  { value: 'CONTINUOUS', label: 'Every time', detail: 'Progress restarts after each reward' },
  { value: 'ONE_TIME', label: 'Once only', detail: 'One reward per customer' },
]

/** sink's NOTIFICATIONS. */
export const NOTIFICATIONS = [
  { key: 'welcome', label: 'Welcome message', detail: 'The moment a customer joins' },
  { key: 'progress', label: 'Progress updates', detail: 'After each qualifying visit' },
  { key: 'rewardReady', label: 'Reward ready', detail: 'When they’ve earned the reward' },
  { key: 'expiry', label: 'Expiry reminder', detail: 'Before their progress runs out' },
] as const
type NotificationKey = typeof NOTIFICATIONS[number]['key']

export const STEPS = [
  { title: 'What should this loyalty improve?', short: 'Goal' },
  { title: 'Set the condition and reward', short: 'Reward' },
  { title: 'Set the rules', short: 'Rules' },
  { title: 'Make it yours', short: 'Finish' },
] as const

const DEFAULT_NOTIFY: Record<NotificationKey, boolean> = { welcome: true, progress: true, rewardReady: true, expiry: true }

/** The design's Create loyalty modal; sends sink-inventory's create payload (wizard buildPayload). */
export function useCreateLoyalty() {
  const navigate = useNavigate()
  const open = useUiStore(state => state.createLoyaltyOpen)
  const close = useUiStore(state => state.closeCreateLoyalty)
  const businessName = useBusinessDataStore(state => state.businessData?.name) || 'Your business'
  const create = useCreateProgram()
  const storeColour = useCardColour()
  const saveColour = useSaveCardColour()

  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const [goal, setGoalState] = useState<Goal>('visits')
  const [mode, setMode] = useState<RuleMode>('VISIT')
  const [visits, setVisits] = useState('5')
  const [spend, setSpend] = useState('')
  const [minSpend, setMinSpend] = useState('')
  const [rewardType, setRewardType] = useState<RewardType>('FREE_ITEM')
  const [rewardValue, setRewardValue] = useState('')
  const [rewardItem, setRewardItem] = useState<{ id: string; name: string } | null>(null)
  const [itemSearch, setItemSearch] = useState('')
  const [timeLimit, setTimeLimit] = useState(30)
  const [customDays, setCustomDays] = useState('')
  const [visitWindow, setVisitWindow] = useState(24)
  const [customHours, setCustomHours] = useState('')
  const [timeoutAction, setTimeoutAction] = useState<ProgramInput['timeoutAction']>('RESTART')
  const [rewardStyle, setRewardStyle] = useState<ProgramInput['rewardStyle']>('CONTINUOUS')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [picked, setColour] = useState<string | null>(null)
  const [channel, setChannel] = useState<ProgramInput['channel']>('BOTH')
  const [notify, setNotify] = useState(DEFAULT_NOTIFY)
  const [error, setError] = useState('')

  const colour = picked ?? storeColour
  const needsItem = rewardType === 'FREE_ITEM' || rewardType === 'FREE_SERVICE'
  const debouncedSearch = useDebounce(itemSearch, 300)
  const items = useRewardItems(rewardType === 'FREE_SERVICE' ? 'SERVICE' : 'PRODUCT', debouncedSearch, open && step === 2 && needsItem)
  const days = timeLimit === -1 ? Number(customDays || 0) : timeLimit
  const hours = visitWindow === -1 ? Number(customHours || 0) : visitWindow

  const reset = () => {
    setStep(1); setReached(1); setGoalState('visits'); setMode('VISIT'); setVisits('5'); setSpend(''); setMinSpend('')
    setRewardType('FREE_ITEM'); setRewardValue(''); setRewardItem(null); setItemSearch('')
    setTimeLimit(30); setCustomDays(''); setVisitWindow(24); setCustomHours(''); setTimeoutAction('RESTART'); setRewardStyle('CONTINUOUS')
    setName(''); setDescription(''); setColour(null); setChannel('BOTH'); setNotify(DEFAULT_NOTIFY); setError('')
  }
  const dismiss = () => { close(); reset() }

  const rewardLabel = needsItem ? (rewardItem ? `Free ${rewardItem.name}` : rewardType === 'FREE_ITEM' ? 'A free product' : 'A free service')
    : rewardType === 'PERCENTAGE' ? `${rewardValue || '0'}% off` : rewardType === 'WALLET_CREDIT' ? `₦${Number(rewardValue || 0).toLocaleString()} wallet credit` : `${rewardValue || '0'} bonus points`
  const conditionLabel = mode === 'SPEND' ? `Spend ₦${Number(spend || 0).toLocaleString()}` : mode === 'BOTH' ? `Visit ${visits} times and spend ₦${Number(spend || 0).toLocaleString()}` : `Visit ${visits} times`
  const windowLabel = days > 0 ? ` within ${days} days` : ''

  /** sink's stepError, per step. */
  const errorFor = (at: number): string => {
    if (at === 2) {
      if (mode !== 'SPEND' && !(Number(visits) >= 1)) return 'Enter how many visits it takes.'
      if (mode !== 'VISIT' && !(Number(spend) > 0)) return 'Enter the spend target.'
      if (needsItem && !rewardItem) return `Pick or type the ${rewardType === 'FREE_ITEM' ? 'product' : 'service'} customers get for free.`
      if (!needsItem && !(Number(rewardValue) > 0)) return 'Enter the reward value.'
      if (rewardType === 'PERCENTAGE' && Number(rewardValue) > 100) return 'A discount can’t be more than 100%.'
    }
    if (at === 3) {
      if (timeLimit === -1 && !(Number(customDays) > 0)) return 'Enter the number of days.'
      if (visitWindow === -1 && !(Number(customHours) >= 0 && customHours !== '')) return 'Enter the hours between visits.'
    }
    if (at === 4 && !name.trim()) return 'Give your program a name.'
    return ''
  }

  const publish = () => {
    for (let at = 2; at <= 4; at += 1) {
      const problem = errorFor(at)
      if (problem) { setStep(at); return setError(problem) }
    }
    const input: ProgramInput = {
      name, description, ruleMode: mode, visits: Number(visits) || 1, spendTarget: spend, minSpendPerVisit: minSpend,
      completionWindowDays: days > 0 ? days : null, visitWindowHours: hours, rewardType, rewardValue: needsItem ? '' : rewardValue, rewardItemId: rewardItem?.id ?? '', rewardDescription: needsItem && rewardItem ? `Free ${rewardItem.name}` : '',
      rewardStyle, timeoutAction, channel,
      notifyWelcome: notify.welcome, notifyProgress: notify.progress, notifyRewardReady: notify.rewardReady, notifyExpiry: notify.expiry,
    }
    create.mutate(input, {
      onSuccess: program => {
        if (picked && picked !== storeColour) saveColour.mutate(picked)
        toast.success(`${program.name || 'Your program'} is live`)
        dismiss()
        if (program.id) navigate(programPath(program.id))
      },
      onError: failure => setError(errorMessage(failure, 'Could not create the program.')),
    })
  }

  return {
    open,
    close: dismiss,
    step,
    reached,
    steps: STEPS,
    title: STEPS[step - 1].title,
    error,
    goal,
    setGoal: (value: Goal) => {
      setGoalState(value)
      const option = GOALS.find(item => item.value === value)
      if (option) setMode(option.mode)
      if (value === 'streak') setTimeLimit(30)
    },
    mode, setMode: (value: RuleMode) => { setMode(value); setError('') },
    visits, setVisits, spend, setSpend, minSpend, setMinSpend,
    rewardType, setRewardType: (value: RewardType) => { setRewardType(value); setRewardItem(null); setRewardValue(''); setError('') },
    rewardValue, setRewardValue, needsItem,
    rewardItem, pickItem: (item: { id: string; name: string }) => { setRewardItem(item); setError('') },
    /** For a business with no inventory: the item is just its name (sent as reward_description). */
    useTypedItem: () => { const name = itemSearch.trim(); if (name) { setRewardItem({ id: '', name }); setError('') } },
    itemSearch, setItemSearch, items: items.data ?? [], itemsLoading: items.isLoading,
    timeLimit, setTimeLimit, customDays, setCustomDays,
    visitWindow, setVisitWindow, customHours, setCustomHours,
    timeoutAction, setTimeoutAction, rewardStyle, setRewardStyle,
    name, setName, description, setDescription, colour, setColour, channel, setChannel,
    notify, toggleNotify: (key: NotificationKey) => setNotify(current => ({ ...current, [key]: !current[key] })),
    back: () => { setError(''); setStep(current => Math.max(1, current - 1)) },
    /** Jump back to a step already completed (sink's goToStep). */
    goTo: (target: number) => { if (target < step || target <= reached) { setError(''); setStep(target) } },
    next: () => {
      const problem = errorFor(step)
      if (problem) return setError(problem)
      setError('')
      const target = Math.min(STEPS.length, step + 1)
      setStep(target)
      setReached(current => Math.max(current, target))
    },
    publish,
    saving: create.isPending,
    preview: { businessName, initials: businessName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(), name: name || 'Your program', line: `${conditionLabel}${windowLabel}. ${rewardLabel}.`, stamps: mode === 'SPEND' ? 5 : Math.min(10, Number(visits) || 5) },
  }
}

export type CreateLoyaltyModel = ReturnType<typeof useCreateLoyalty>
