import { supabase } from './client'

// ============ Constants ============

export const INCOME_CATEGORIES = [
  'Pedido',
  'Abono',
  'Delivery',
  'Otro ingreso',
] as const

export const EXPENSE_CATEGORIES = [
  'Insumos',
  'Salarios',
  'Servicios',
  'Arriendo',
  'Transporte',
  'Marketing',
  'Equipamiento',
  'Otro gasto',
] as const

export const PAYMENT_METHODS = [
  'Efectivo',
  'Transferencia',
  'MercadoPago',
  'Otro',
] as const

export type IncomeCategory = typeof INCOME_CATEGORIES[number]
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
export type PaymentMethod = typeof PAYMENT_METHODS[number]
export type TransactionType = 'income' | 'expense'

// ============ Types ============

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  amount: number
  description: string | null
  reference_id: string | null
  reference_type: string | null
  payment_method: string | null
  transaction_date: string
  created_by: string | null
  created_at: string
}

export interface TransactionFilters {
  type?: TransactionType
  category?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface FinanceSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  pendingPayments: number
  incomeCount: number
  expenseCount: number
}

export interface MonthlyDataPoint {
  month: number
  monthName: string
  income: number
  expenses: number
  profit: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  count: number
}

export interface TransactionFormData {
  type: TransactionType
  category: string
  amount: number
  description?: string
  payment_method?: string
  transaction_date: string
  reference_id?: string
  reference_type?: string
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

// ============ Transactions ============

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<{ data: Transaction[]; count: number }> {
  const { type, category, dateFrom, dateTo, page = 1, pageSize = 50 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type) {
    query = query.eq('type', type)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (dateFrom) {
    query = query.gte('transaction_date', dateFrom)
  }

  if (dateTo) {
    query = query.lte('transaction_date', dateTo)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

export async function createTransaction(
  transactionData: TransactionFormData
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    return null
  }

  return data
}

export async function updateTransaction(
  id: string,
  updates: Partial<TransactionFormData>
): Promise<boolean> {
  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating transaction:', error)
    return false
  }

  return true
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting transaction:', error)
    return false
  }

  return true
}

// ============ Summary ============

export async function getFinanceSummary(
  month: number,
  year: number
): Promise<FinanceSummary> {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  // Fetch all transactions for the month
  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (error) {
    console.error('Error fetching finance summary:', error)
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      pendingPayments: 0,
      incomeCount: 0,
      expenseCount: 0,
    }
  }

  const transactions = data || []

  const incomeTransactions = transactions.filter(t => t.type === 'income')
  const expenseTransactions = transactions.filter(t => t.type === 'expense')

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

  // Fetch pending payments from orders (not fully paid, in active statuses)
  const { data: pendingOrders, error: ordersError } = await supabase
    .from('orders')
    .select('total, deposit_amount, deposit_paid, payment_status')
    .in('status', ['pending', 'confirmed', 'in_production', 'ready'])
    .neq('payment_status', 'paid')

  let pendingPayments = 0
  if (!ordersError && pendingOrders) {
    pendingPayments = pendingOrders.reduce((sum, order) => {
      const total = Number(order.total) || 0
      const deposit = order.deposit_paid ? Number(order.deposit_amount) || 0 : 0
      return sum + (total - deposit)
    }, 0)
  }

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    pendingPayments,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
  }
}

// ============ Monthly Chart Data ============

export async function getMonthlyFinanceData(year: number): Promise<MonthlyDataPoint[]> {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (error) {
    console.error('Error fetching monthly data:', error)
    return []
  }

  const monthlyMap: Record<number, { income: number; expenses: number }> = {}

  for (let m = 1; m <= 12; m++) {
    monthlyMap[m] = { income: 0, expenses: 0 }
  }

  for (const tx of data || []) {
    const month = parseInt(tx.transaction_date.split('-')[1], 10)
    const amount = Number(tx.amount)

    if (tx.type === 'income') {
      monthlyMap[month].income += amount
    } else {
      monthlyMap[month].expenses += amount
    }
  }

  return Object.entries(monthlyMap).map(([m, values]) => {
    const monthNum = parseInt(m, 10)
    return {
      month: monthNum,
      monthName: MONTH_NAMES[monthNum - 1],
      income: values.income,
      expenses: values.expenses,
      profit: values.income - values.expenses,
    }
  })
}

// ============ Category Breakdowns ============

export async function getExpensesByCategory(
  month: number,
  year: number
): Promise<CategoryBreakdown[]> {
  return getCategoryBreakdown('expense', month, year)
}

export async function getIncomeByCategory(
  month: number,
  year: number
): Promise<CategoryBreakdown[]> {
  return getCategoryBreakdown('income', month, year)
}

async function getCategoryBreakdown(
  type: TransactionType,
  month: number,
  year: number
): Promise<CategoryBreakdown[]> {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('type', type)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (error) {
    console.error('Error fetching category breakdown:', error)
    return []
  }

  const categoryMap: Record<string, { amount: number; count: number }> = {}

  for (const tx of data || []) {
    if (!categoryMap[tx.category]) {
      categoryMap[tx.category] = { amount: 0, count: 0 }
    }
    categoryMap[tx.category].amount += Number(tx.amount)
    categoryMap[tx.category].count += 1
  }

  const total = Object.values(categoryMap).reduce((sum, c) => sum + c.amount, 0)

  return Object.entries(categoryMap)
    .map(([category, values]) => ({
      category,
      amount: values.amount,
      percentage: total > 0 ? Math.round((values.amount / total) * 100) : 0,
      count: values.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// ============ Transaction Categories ============

export async function getTransactionCategories(): Promise<{
  income: string[]
  expense: string[]
}> {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, category')

  if (error) {
    console.error('Error fetching categories:', error)
    return {
      income: [...INCOME_CATEGORIES],
      expense: [...EXPENSE_CATEGORIES],
    }
  }

  const incomeSet = new Set<string>(INCOME_CATEGORIES)
  const expenseSet = new Set<string>(EXPENSE_CATEGORIES)

  for (const tx of data || []) {
    if (tx.type === 'income') incomeSet.add(tx.category)
    else expenseSet.add(tx.category)
  }

  return {
    income: Array.from(incomeSet).sort(),
    expense: Array.from(expenseSet).sort(),
  }
}
