'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CalendarProps {
  selected?: Date | null
  onSelect?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
  disabledDays?: number[] // 0=Sun, 1=Mon, ..., 6=Sat
  className?: string
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ selected, onSelect, minDate, maxDate, disabledDates = [], disabledDays = [], className }, ref) => {
    const [currentMonth, setCurrentMonth] = useState(selected || new Date())

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    const isDisabled = (day: number | null): boolean => {
      if (!day) return true
      const date = new Date(year, month, day)
      if (minDate) {
        const min = new Date(minDate)
        min.setHours(0, 0, 0, 0)
        if (date < min) return true
      }
      if (maxDate) {
        const max = new Date(maxDate)
        max.setHours(23, 59, 59, 999)
        if (date > max) return true
      }
      if (disabledDays.includes(date.getDay())) return true
      if (disabledDates.some((d) => isSameDay(d, date))) return true
      return false
    }

    const isSelected = (day: number | null): boolean => {
      if (!day || !selected) return false
      return isSameDay(new Date(year, month, day), selected)
    }

    const isToday = (day: number | null): boolean => {
      if (!day) return false
      return isSameDay(new Date(year, month, day), new Date())
    }

    const handleDayClick = (day: number | null) => {
      if (!day || isDisabled(day)) return
      onSelect?.(new Date(year, month, day))
    }

    const goToPrev = () => setCurrentMonth(new Date(year, month - 1))
    const goToNext = () => setCurrentMonth(new Date(year, month + 1))

    return (
      <div ref={ref} className={cn('bg-white rounded-2xl p-6 shadow-sm', className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPrev}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Mes anterior"
          >
            <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="font-display text-xl font-semibold text-dark">
            {monthNames[month]} {year}
          </h3>

          <button
            onClick={goToNext}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Mes siguiente"
          >
            <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((name) => (
            <div key={name} className="text-center text-xs font-medium text-dark-light py-2">
              {name}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const disabled = isDisabled(day)
            const selected_ = isSelected(day)
            const today = isToday(day)

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                disabled={disabled || !day}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
                  !day && 'invisible',
                  !disabled && !selected_ && 'hover:bg-primary/10 text-dark hover:scale-105',
                  selected_ && 'bg-primary text-white shadow-md scale-105',
                  disabled && day && 'text-dark-light/30 cursor-not-allowed',
                  today && !selected_ && 'ring-2 ring-primary/30'
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)

Calendar.displayName = 'Calendar'
