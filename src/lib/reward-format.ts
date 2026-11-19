/**
 * A reward figure in the unit its programme rewards in (sink's formatRewardAmount): a percentage
 * discount totals a percentage, points total points, and credit or free items total money.
 */
export const formatRewardAmount = (value: number, rewardType: string, money: (amount: number) => string) => {
  if (rewardType === 'PERCENTAGE') return `${Number.isInteger(value) ? value : value.toFixed(1)}%`
  if (rewardType === 'POINTS') return `${value.toLocaleString()} ${value === 1 ? 'point' : 'points'}`
  return money(value)
}

/** Rates arrive as 50 or 33.33: at most one decimal. */
export const asRate = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))
