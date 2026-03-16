import { supabase } from './client'

export interface DailyCapacity {
  id: string
  date: string
  max_orders: number
  current_orders: number
  is_blocked: boolean
  block_reason: string | null
  created_at: string
}

export interface CapacityUpsertData {
  max_orders?: number
  is_blocked?: boolean
  block_reason?: string | null
}

export interface AvailabilityInfo {
  date: string
  max_orders: number
  current_orders: number
  is_blocked: boolean
  block_reason: string | null
  available_slots: number
  status: 'available' | 'almost_full' | 'full' | 'blocked'
}

// Default max orders when no record exists for a date
const DEFAULT_MAX_ORDERS = 5

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function computeStatus(capacity: AvailabilityInfo): AvailabilityInfo['status'] {
  if (capacity.is_blocked) return 'blocked'
  const ratio = capacity.current_orders / capacity.max_orders
  if (ratio >= 1) return 'full'
  if (ratio >= 0.7) return 'almost_full'
  return 'available'
}

/**
 * Returns all daily_capacity records for a given month.
 * Month is 1-indexed (January = 1).
 */
export async function getCapacityForMonth(year: number, month: number): Promise<DailyCapacity[]> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // last day of month

  const { data, error } = await supabase
    .from('daily_capacity')
    .select('*')
    .gte('date', toDateString(startDate))
    .lte('date', toDateString(endDate))
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching monthly capacity:', error)
    return []
  }

  return data ?? []
}

/**
 * Returns the capacity record for a specific date string (YYYY-MM-DD).
 * Returns null if no override exists for that date.
 */
export async function getCapacityForDate(date: string): Promise<DailyCapacity | null> {
  const { data, error } = await supabase
    .from('daily_capacity')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (error) {
    console.error('Error fetching capacity for date:', error)
    return null
  }

  return data
}

/**
 * Creates or updates a date's capacity settings.
 * Uses upsert with conflict resolution on the unique date column.
 */
export async function upsertCapacity(
  date: string,
  data: CapacityUpsertData
): Promise<DailyCapacity | null> {
  const { data: result, error } = await supabase
    .from('daily_capacity')
    .upsert(
      { date, ...data },
      { onConflict: 'date' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting capacity:', error)
    return null
  }

  return result
}

/**
 * Marks a specific date as blocked with an optional reason.
 */
export async function blockDate(date: string, reason?: string): Promise<DailyCapacity | null> {
  return upsertCapacity(date, {
    is_blocked: true,
    block_reason: reason ?? null,
  })
}

/**
 * Removes the blocked flag from a specific date.
 */
export async function unblockDate(date: string): Promise<DailyCapacity | null> {
  return upsertCapacity(date, {
    is_blocked: false,
    block_reason: null,
  })
}

/**
 * Blocks multiple dates at once with the same reason.
 * Returns the number of dates successfully processed.
 */
export async function bulkBlockDates(dates: string[], reason?: string): Promise<number> {
  if (dates.length === 0) return 0

  const rows = dates.map(date => ({
    date,
    is_blocked: true,
    block_reason: reason ?? null,
  }))

  const { data, error } = await supabase
    .from('daily_capacity')
    .upsert(rows, { onConflict: 'date' })
    .select()

  if (error) {
    console.error('Error bulk blocking dates:', error)
    return 0
  }

  return data?.length ?? 0
}

/**
 * Returns availability info for each date in a range, merging database overrides
 * with the provided default max orders (or DEFAULT_MAX_ORDERS).
 * Also syncs current_orders counts from the orders table.
 */
export async function getAvailableDates(
  startDate: string,
  endDate: string,
  defaultMax: number = DEFAULT_MAX_ORDERS
): Promise<AvailabilityInfo[]> {
  // Fetch existing capacity overrides for the range
  const { data: capacityRows, error: capError } = await supabase
    .from('daily_capacity')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (capError) {
    console.error('Error fetching availability:', capError)
    return []
  }

  // Fetch actual order counts for the range (confirmed/in_production/ready orders)
  const { data: orderCounts, error: ordError } = await supabase
    .from('orders')
    .select('delivery_date')
    .gte('delivery_date', startDate)
    .lte('delivery_date', endDate)
    .not('status', 'in', '("cancelled","completed","delivered")')

  if (ordError) {
    console.error('Error fetching order counts:', ordError)
  }

  // Build a lookup map: date -> actual order count
  const orderCountMap: Record<string, number> = {}
  orderCounts?.forEach(o => {
    const d = o.delivery_date
    orderCountMap[d] = (orderCountMap[d] ?? 0) + 1
  })

  // Build a lookup map for overrides
  const overrideMap: Record<string, DailyCapacity> = {}
  capacityRows?.forEach(row => {
    overrideMap[row.date] = row
  })

  // Generate all dates in the range
  const result: AvailabilityInfo[] = []
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  const current = new Date(start)

  while (current <= end) {
    const dateStr = toDateString(current)
    const override = overrideMap[dateStr]
    const liveOrderCount = orderCountMap[dateStr] ?? 0

    const info: AvailabilityInfo = {
      date: dateStr,
      max_orders: override?.max_orders ?? defaultMax,
      current_orders: liveOrderCount,
      is_blocked: override?.is_blocked ?? false,
      block_reason: override?.block_reason ?? null,
      available_slots: Math.max(0, (override?.max_orders ?? defaultMax) - liveOrderCount),
      status: 'available',
    }

    info.status = computeStatus(info)
    result.push(info)

    current.setDate(current.getDate() + 1)
  }

  return result
}
