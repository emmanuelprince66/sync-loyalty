import { useState } from 'react'
import { toApiDate, type DateRange } from '@/components/ui/DateRangeFilter'

/** A page's date filter: the picker's range, and start_date / end_date for the query (undefined when open). */
export function useApiDateRange(onChange?: () => void) {
  const [range, setRange] = useState<DateRange | undefined>()
  return {
    range,
    setRange: (next: DateRange | undefined) => { setRange(next); onChange?.() },
    query: { startDate: toApiDate(range?.from) || undefined, endDate: toApiDate(range?.to) || undefined },
  }
}
