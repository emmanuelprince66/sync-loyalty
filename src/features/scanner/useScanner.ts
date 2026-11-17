import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useLoyaltyCustomers, useMemberWallet, useRedeemReward, useRewards } from '@/api/loyalty'
import { useDebounce } from '@/hooks/useDebounce'
import { usePermissions } from '@/hooks/usePermissions'

/** A member card QR holds the bare loyalty code (as in sink); a progress link (…/loyalty/progress/{code}) is read too. */
export const codeFromScan = (text: string) => {
  const match = text.match(/\/loyalty\/progress\/([^/?#]+)/)
  return decodeURIComponent(match ? match[1] : text).trim().toUpperCase()
}

/**
 * Scanner: find a member by QR (camera), loyalty code, phone or name; show their card and
 * redeem rewards they've earned (POST loyalty/rewards/{id}/redeem/ with their loyalty code).
 */
export function useScanner() {
  const [params, setParams] = useSearchParams()
  const code = (params.get('code') ?? '').toUpperCase()
  const { canAddCustomers } = usePermissions()
  const [query, setQuery] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [registering, setRegistering] = useState(false)
  const debounced = useDebounce(query.trim(), 350)

  const matches = useLoyaltyCustomers(debounced.length >= 3 ? debounced : '')
  const wallet = useMemberWallet(code)
  const issued = useRewards('ISSUED')
  const redeem = useRedeemReward()

  const setCode = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('code', value)
    else next.delete('code')
    setParams(next, { replace: true })
  }

  /** Rewards ready to hand over: from the member's wallet, or issued rewards with their code. */
  const rewards = useMemo(() => {
    const fromWallet = wallet.data?.availableRewards ?? []
    if (fromWallet.length) return fromWallet
    return (issued.data ?? []).filter(reward => reward.code.toUpperCase() === code).map(reward => ({ id: reward.id, label: `${reward.program} · ${reward.value}` }))
  }, [wallet.data, issued.data, code])

  const looksLikeCode = /^[A-Z]{2,}-?\d+$/i.test(query.trim())

  return {
    code,
    wallet: wallet.data ?? null,
    walletLoading: wallet.isLoading && code.length >= 3,
    walletError: wallet.isError ? errorMessage(wallet.error, 'We couldn’t find a member with that code.') : '',
    rewards,
    redeemingId: redeem.isPending ? redeem.variables?.rewardId ?? '' : '',
    redeem: (rewardId: string) => redeem.mutate({ rewardId, loyaltyCode: code }, {
      onSuccess: () => { toast.success('Reward redeemed'); void wallet.refetch() },
      onError: error => toast.error(errorMessage(error, 'Could not redeem this reward.')),
    }),
    query,
    setQuery,
    matches: debounced.length >= 3 ? matches.data ?? [] : [],
    searching: matches.isFetching && debounced.length >= 3,
    submitQuery: () => { if (looksLikeCode) setCode(query.trim().toUpperCase()) },
    pick: (memberCode: string) => { setQuery(''); setCode(memberCode) },
    cameraOn,
    startCamera: () => setCameraOn(true),
    stopCamera: () => setCameraOn(false),
    onScan: (text: string) => { setCameraOn(false); setCode(codeFromScan(text)) },
    reset: () => { setCode(''); setQuery('') },
    canRegister: canAddCustomers,
    registering,
    register: () => setRegistering(true),
    closeRegister: () => setRegistering(false),
  }
}
