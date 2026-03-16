'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getFinanceSummary,
  getMonthlyFinanceData,
  getExpensesByCategory,
  getIncomeByCategory,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type Transaction,
  type TransactionFormData,
  type FinanceSummary,
  type MonthlyDataPoint,
  type CategoryBreakdown,
  type TransactionType,
} from '@/lib/supabase/finance-queries'

// ============ Helpers ============

function getCurrentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

function toDateInputValue(dateStr: string) {
  return dateStr.split('T')[0]
}

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ============ Transaction Modal ============

interface TransactionModalProps {
  mode: 'income' | 'expense'
  onClose: () => void
  onSaved: () => void
}

function TransactionModal({ mode, onClose, onSaved }: TransactionModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<TransactionFormData>({
    type: mode,
    category: mode === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    amount: 0,
    description: '',
    payment_method: 'Efectivo',
    transaction_date: today,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = mode === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleChange = (
    field: keyof TransactionFormData,
    value: string | number
  ) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.amount || form.amount <= 0) {
      setError('El monto debe ser mayor a cero.')
      return
    }
    if (!form.category) {
      setError('Selecciona una categoría.')
      return
    }
    if (!form.transaction_date) {
      setError('Selecciona una fecha.')
      return
    }

    setSaving(true)
    const result = await createTransaction(form)
    setSaving(false)

    if (!result) {
      setError('No se pudo guardar la transacción. Intenta de nuevo.')
      return
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={cn(
          'px-6 py-4 flex items-center justify-between',
          mode === 'income' ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              mode === 'income' ? 'bg-green-500' : 'bg-primary'
            )}>
              {mode === 'income' ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              )}
            </div>
            <h2 className="font-display font-semibold text-dark text-lg">
              {mode === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 transition-colors"
          >
            <svg className="w-5 h-5 text-dark-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Categoria <span className="text-primary">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Monto <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-light text-sm font-medium">$</span>
              <input
                type="number"
                min={0}
                step={100}
                value={form.amount || ''}
                onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Descripcion
            </label>
            <input
              type="text"
              value={form.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Descripcion opcional..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Fecha <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              value={form.transaction_date}
              onChange={e => handleChange('transaction_date', e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Metodo de pago
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleChange('payment_method', method)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    form.payment_method === method
                      ? 'bg-dark text-white border-dark'
                      : 'bg-white text-dark-light border-border hover:border-dark/40'
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saving}
              className={cn(
                'flex-1',
                mode === 'expense' ? 'bg-primary hover:bg-primary-hover' : 'bg-green-600 hover:bg-green-700'
              )}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ Delete Confirm Modal ============

interface DeleteModalProps {
  transaction: Transaction
  onClose: () => void
  onDeleted: () => void
}

function DeleteModal({ transaction, onClose, onDeleted }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const ok = await deleteTransaction(transaction.id)
    setDeleting(false)
    if (ok) {
      onDeleted()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="font-display font-semibold text-dark text-lg mb-2">Eliminar transaccion</h3>
        <p className="text-dark-light text-sm mb-1">
          ¿Confirmas eliminar esta transaccion?
        </p>
        <p className="text-sm font-medium text-dark mb-6">
          {transaction.category} — {formatCurrency(transaction.amount)}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-600 text-white text-sm font-semibold rounded-full px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ Payment Method Badge ============

function PaymentBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-dark-light text-xs">-</span>

  const styles: Record<string, string> = {
    'Efectivo': 'bg-green-100 text-green-700',
    'Transferencia': 'bg-blue-100 text-blue-700',
    'MercadoPago': 'bg-blue-100 text-[#009ee3]',
    'Otro': 'bg-gray-100 text-gray-600',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      styles[method] || 'bg-gray-100 text-gray-600'
    )}>
      {method}
    </span>
  )
}

// ============ CSS Bar Chart ============

function BarChart({ data }: { data: MonthlyDataPoint[] }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses)), 1)

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-40">
        {data.map((point) => {
          const incomeH = Math.round((point.income / maxValue) * 100)
          const expenseH = Math.round((point.expenses / maxValue) * 100)

          return (
            <div key={point.month} className="flex-1 flex flex-col items-center gap-0.5 group">
              {/* Tooltip on hover */}
              <div className="hidden group-hover:flex flex-col items-center absolute z-10 -translate-y-20 bg-dark text-white text-[10px] rounded-lg px-2 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
                <span className="text-green-400">{formatCurrency(point.income)}</span>
                <span className="text-red-300">{formatCurrency(point.expenses)}</span>
              </div>

              {/* Bars container */}
              <div className="flex items-end gap-0.5 h-32 w-full">
                {/* Income bar */}
                <div className="flex-1 flex items-end">
                  <div
                    className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: `${incomeH}%`,
                      backgroundColor: '#8FBC8F',
                      minHeight: point.income > 0 ? '3px' : '0',
                    }}
                    title={`Ingreso: ${formatCurrency(point.income)}`}
                  />
                </div>
                {/* Expense bar */}
                <div className="flex-1 flex items-end">
                  <div
                    className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: `${expenseH}%`,
                      backgroundColor: '#D4847C',
                      minHeight: point.expenses > 0 ? '3px' : '0',
                    }}
                    title={`Gasto: ${formatCurrency(point.expenses)}`}
                  />
                </div>
              </div>

              {/* Month label */}
              <span className="text-[9px] text-dark-light font-medium mt-1 leading-none">
                {point.monthName}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#8FBC8F' }} />
          <span className="text-xs text-dark-light">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#D4847C' }} />
          <span className="text-xs text-dark-light">Gastos</span>
        </div>
      </div>
    </div>
  )
}

// ============ Category Distribution Bars ============

function CategoryBars({
  data,
  color,
  emptyLabel,
}: {
  data: CategoryBreakdown[]
  color: string
  emptyLabel: string
}) {
  if (data.length === 0) {
    return (
      <p className="text-dark-light text-sm text-center py-4">{emptyLabel}</p>
    )
  }

  return (
    <div className="space-y-3">
      {data.map(item => (
        <div key={item.category}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-dark">{item.category}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-light">{item.percentage}%</span>
              <span className="text-xs font-semibold text-dark">{formatCurrency(item.amount)}</span>
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============ Transactions Table ============

interface TransactionsTableProps {
  transactions: Transaction[]
  loading: boolean
  onDelete: (tx: Transaction) => void
  emptyLabel: string
}

function TransactionsTable({ transactions, loading, onDelete, emptyLabel }: TransactionsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 py-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center">
        <svg className="w-12 h-12 text-border mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-dark-light text-sm">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-dark-light uppercase tracking-wider px-6 py-3">Fecha</th>
            <th className="text-left text-xs font-semibold text-dark-light uppercase tracking-wider px-3 py-3">Categoria</th>
            <th className="text-left text-xs font-semibold text-dark-light uppercase tracking-wider px-3 py-3">Descripcion</th>
            <th className="text-left text-xs font-semibold text-dark-light uppercase tracking-wider px-3 py-3">Metodo</th>
            <th className="text-right text-xs font-semibold text-dark-light uppercase tracking-wider px-6 py-3">Monto</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr
              key={tx.id}
              className={cn(
                'border-b border-border/50 hover:bg-secondary/50 transition-colors',
                index % 2 === 0 ? 'bg-white' : 'bg-secondary/30'
              )}
            >
              <td className="px-6 py-3 text-sm text-dark-light whitespace-nowrap">
                {formatDate(tx.transaction_date, { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-dark">
                  {tx.category}
                </span>
              </td>
              <td className="px-3 py-3 text-sm text-dark max-w-xs">
                <span className="line-clamp-1">{tx.description || <span className="text-dark-light">-</span>}</span>
              </td>
              <td className="px-3 py-3">
                <PaymentBadge method={tx.payment_method} />
              </td>
              <td className="px-6 py-3 text-right">
                <span className={cn(
                  'text-sm font-semibold',
                  tx.type === 'income' ? 'text-green-600' : 'text-primary'
                )}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </td>
              <td className="px-3 py-3">
                <button
                  onClick={() => onDelete(tx)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-dark-light hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============ Main Page ============

type Tab = 'resumen' | 'ingresos' | 'egresos'

export default function FinanzasPage() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()

  // Selected period
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Active tab
  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  // Summary data
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryBreakdown[]>([])
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryBreakdown[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)

  // Income tab
  const [incomeTransactions, setIncomeTransactions] = useState<Transaction[]>([])
  const [loadingIncome, setLoadingIncome] = useState(false)
  const [incomeCategory, setIncomeCategory] = useState('')
  const [incomeDateFrom, setIncomeDateFrom] = useState('')
  const [incomeDateTo, setIncomeDateTo] = useState('')

  // Expense tab
  const [expenseTransactions, setExpenseTransactions] = useState<Transaction[]>([])
  const [loadingExpense, setLoadingExpense] = useState(false)
  const [expenseCategory, setExpenseCategory] = useState('')
  const [expenseDateFrom, setExpenseDateFrom] = useState('')
  const [expenseDateTo, setExpenseDateTo] = useState('')

  // Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  // Year options
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // ---- Loaders ----

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true)
    const [sum, monthly, expCat, incCat] = await Promise.all([
      getFinanceSummary(selectedMonth, selectedYear),
      getMonthlyFinanceData(selectedYear),
      getExpensesByCategory(selectedMonth, selectedYear),
      getIncomeByCategory(selectedMonth, selectedYear),
    ])
    setSummary(sum)
    setMonthlyData(monthly)
    setExpensesByCategory(expCat)
    setIncomeByCategory(incCat)
    setLoadingSummary(false)
  }, [selectedMonth, selectedYear])

  const loadIncomeTransactions = useCallback(async () => {
    setLoadingIncome(true)
    const { data } = await getTransactions({
      type: 'income',
      category: incomeCategory || undefined,
      dateFrom: incomeDateFrom || undefined,
      dateTo: incomeDateTo || undefined,
    })
    setIncomeTransactions(data)
    setLoadingIncome(false)
  }, [incomeCategory, incomeDateFrom, incomeDateTo])

  const loadExpenseTransactions = useCallback(async () => {
    setLoadingExpense(true)
    const { data } = await getTransactions({
      type: 'expense',
      category: expenseCategory || undefined,
      dateFrom: expenseDateFrom || undefined,
      dateTo: expenseDateTo || undefined,
    })
    setExpenseTransactions(data)
    setLoadingExpense(false)
  }, [expenseCategory, expenseDateFrom, expenseDateTo])

  // ---- Effects ----

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    if (activeTab === 'ingresos') loadIncomeTransactions()
  }, [activeTab, loadIncomeTransactions])

  useEffect(() => {
    if (activeTab === 'egresos') loadExpenseTransactions()
  }, [activeTab, loadExpenseTransactions])

  // ---- Computed Totals ----

  const incomeTotal = incomeTransactions.reduce((s, t) => s + Number(t.amount), 0)
  const expenseTotal = expenseTransactions.reduce((s, t) => s + Number(t.amount), 0)

  // ---- Render ----

  return (
    <div className="flex flex-col min-h-screen bg-light-alt">
      <Header
        title="Finanzas"
        subtitle="Control de ingresos, egresos y reportes financieros"
      />

      <div className="p-6 space-y-6">

        {/* Period selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-dark-light">Periodo:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            {MONTH_LABELS.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-1.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
          {([
            { key: 'resumen', label: 'Resumen' },
            { key: 'ingresos', label: 'Ingresos' },
            { key: 'egresos', label: 'Egresos' },
          ] as { key: Tab; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-dark-light hover:text-dark'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======= TAB: RESUMEN ======= */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">

            {/* Stats Cards */}
            {loadingSummary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-28 bg-white rounded-xl border border-border animate-pulse" />
                ))}
              </div>
            ) : summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ingresos */}
                <div className="bg-white rounded-xl border border-border p-6 border-l-4 border-l-green-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-dark-light uppercase tracking-wider mb-1">
                        Ingresos del mes
                      </p>
                      <p className="text-2xl font-bold text-dark">
                        {formatCurrency(summary.totalIncome)}
                      </p>
                      <p className="text-xs text-dark-light mt-1">
                        {summary.incomeCount} transacciones
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Gastos */}
                <div className="bg-white rounded-xl border border-border p-6 border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-dark-light uppercase tracking-wider mb-1">
                        Gastos del mes
                      </p>
                      <p className="text-2xl font-bold text-dark">
                        {formatCurrency(summary.totalExpenses)}
                      </p>
                      <p className="text-xs text-dark-light mt-1">
                        {summary.expenseCount} transacciones
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Utilidad */}
                <div className={cn(
                  'bg-white rounded-xl border border-border p-6 border-l-4',
                  summary.netProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-dark-light uppercase tracking-wider mb-1">
                        Utilidad neta
                      </p>
                      <p className={cn(
                        'text-2xl font-bold',
                        summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'
                      )}>
                        {formatCurrency(summary.netProfit)}
                      </p>
                      <p className="text-xs text-dark-light mt-1">
                        {summary.netProfit >= 0 ? 'Margen positivo' : 'Margen negativo'}
                      </p>
                    </div>
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      summary.netProfit >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                    )}>
                      <svg
                        className={cn('w-5 h-5', summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-500')}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Por cobrar */}
                <div className="bg-white rounded-xl border border-border p-6 border-l-4 border-l-yellow-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-dark-light uppercase tracking-wider mb-1">
                        Por cobrar
                      </p>
                      <p className="text-2xl font-bold text-dark">
                        {formatCurrency(summary.pendingPayments)}
                      </p>
                      <p className="text-xs text-dark-light mt-1">
                        Saldos de pedidos activos
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Monthly Trend Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
                <h3 className="font-display font-semibold text-dark mb-1">Tendencia anual {selectedYear}</h3>
                <p className="text-xs text-dark-light mb-5">Ingresos vs gastos por mes</p>
                {loadingSummary ? (
                  <div className="h-40 bg-secondary rounded-lg animate-pulse" />
                ) : (
                  <BarChart data={monthlyData} />
                )}
              </div>

              {/* Category Pie-like breakdown */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h3 className="font-display font-semibold text-dark mb-1">Gastos por categoria</h3>
                <p className="text-xs text-dark-light mb-4">
                  {MONTH_LABELS[selectedMonth - 1]} {selectedYear}
                </p>
                {loadingSummary ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <CategoryBars
                    data={expensesByCategory}
                    color="#D4847C"
                    emptyLabel="Sin gastos registrados este mes"
                  />
                )}
              </div>
            </div>

            {/* Income distribution */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-display font-semibold text-dark mb-1">Ingresos por categoria</h3>
              <p className="text-xs text-dark-light mb-4">
                {MONTH_LABELS[selectedMonth - 1]} {selectedYear}
              </p>
              {loadingSummary ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="max-w-xl">
                  <CategoryBars
                    data={incomeByCategory}
                    color="#8FBC8F"
                    emptyLabel="Sin ingresos registrados este mes"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======= TAB: INGRESOS ======= */}
        {activeTab === 'ingresos' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category filter */}
                <select
                  value={incomeCategory}
                  onChange={e => setIncomeCategory(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">Todas las categorias</option>
                  {INCOME_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Date from */}
                <input
                  type="date"
                  value={incomeDateFrom}
                  onChange={e => setIncomeDateFrom(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />

                {/* Date to */}
                <input
                  type="date"
                  value={incomeDateTo}
                  onChange={e => setIncomeDateTo(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />

                {(incomeCategory || incomeDateFrom || incomeDateTo) && (
                  <button
                    onClick={() => {
                      setIncomeCategory('')
                      setIncomeDateFrom('')
                      setIncomeDateTo('')
                    }}
                    className="text-xs text-dark-light hover:text-dark underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => setShowIncomeModal(true)}
                className="whitespace-nowrap bg-green-600 hover:bg-green-700"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Ingreso
                </span>
              </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-border p-6">
              <TransactionsTable
                transactions={incomeTransactions}
                loading={loadingIncome}
                onDelete={setDeleteTarget}
                emptyLabel="No hay ingresos registrados con los filtros aplicados"
              />

              {/* Total */}
              {!loadingIncome && incomeTransactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex justify-end">
                  <div className="text-right">
                    <p className="text-xs text-dark-light uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(incomeTotal)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======= TAB: EGRESOS ======= */}
        {activeTab === 'egresos' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category filter */}
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">Todas las categorias</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Date from */}
                <input
                  type="date"
                  value={expenseDateFrom}
                  onChange={e => setExpenseDateFrom(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />

                {/* Date to */}
                <input
                  type="date"
                  value={expenseDateTo}
                  onChange={e => setExpenseDateTo(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />

                {(expenseCategory || expenseDateFrom || expenseDateTo) && (
                  <button
                    onClick={() => {
                      setExpenseCategory('')
                      setExpenseDateFrom('')
                      setExpenseDateTo('')
                    }}
                    className="text-xs text-dark-light hover:text-dark underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => setShowExpenseModal(true)}
                className="whitespace-nowrap"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Egreso
                </span>
              </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-border p-6">
              <TransactionsTable
                transactions={expenseTransactions}
                loading={loadingExpense}
                onDelete={setDeleteTarget}
                emptyLabel="No hay egresos registrados con los filtros aplicados"
              />

              {/* Total */}
              {!loadingExpense && expenseTransactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex justify-end">
                  <div className="text-right">
                    <p className="text-xs text-dark-light uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(expenseTotal)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showIncomeModal && (
        <TransactionModal
          mode="income"
          onClose={() => setShowIncomeModal(false)}
          onSaved={() => {
            loadSummary()
            if (activeTab === 'ingresos') loadIncomeTransactions()
          }}
        />
      )}

      {showExpenseModal && (
        <TransactionModal
          mode="expense"
          onClose={() => setShowExpenseModal(false)}
          onSaved={() => {
            loadSummary()
            if (activeTab === 'egresos') loadExpenseTransactions()
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          transaction={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            loadSummary()
            if (deleteTarget.type === 'income') loadIncomeTransactions()
            else loadExpenseTransactions()
          }}
        />
      )}
    </div>
  )
}
