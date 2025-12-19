'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface BookingCalendarProps {
  onSelectDate: (date: Date) => void
  selectedDate: Date | null
  minDate?: Date
}

export function BookingCalendar({ onSelectDate, selectedDate, minDate }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Obtener días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  // Generar días del calendario
  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  // Verificar si una fecha está disponible
  const isDateAvailable = (day: number | null) => {
    if (!day) return false

    const date = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fecha mínima de anticipación (3 días por defecto)
    const minBookingDate = minDate || new Date()
    minBookingDate.setDate(minBookingDate.getDate() + 3)
    minBookingDate.setHours(0, 0, 0, 0)

    // No se puede agendar en el pasado ni con menos de 3 días de anticipación
    if (date < minBookingDate) return false

    // Verificar que no sea domingo (opcional)
    if (date.getDay() === 0) return false

    return true
  }

  const handleDateClick = (day: number | null) => {
    if (!day || !isDateAvailable(day)) return

    const date = new Date(year, month, day)
    onSelectDate(date)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1))
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const isSelectedDate = (day: number | null) => {
    if (!day || !selectedDate) return false
    const date = new Date(year, month, day)
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Mes anterior"
        >
          <svg
            className="w-5 h-5 text-dark"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h3 className="font-display text-xl font-semibold text-dark">
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Mes siguiente"
        >
          <svg
            className="w-5 h-5 text-dark"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center text-sm font-medium text-dark-light py-2"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const available = isDateAvailable(day)
          const selected = isSelectedDate(day)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              disabled={!available}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
                !day && 'invisible',
                available && !selected && 'hover:bg-primary/10 text-dark hover:scale-105',
                selected && 'bg-primary text-white shadow-md scale-105',
                !available && day && 'text-dark-light/30 cursor-not-allowed'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-border space-y-2">
        <p className="text-xs text-dark-light">
          <span className="inline-block w-3 h-3 rounded bg-primary mr-2"></span>
          Fecha seleccionada
        </p>
        <p className="text-xs text-dark-light">
          <span className="inline-block w-3 h-3 rounded bg-dark-light/30 mr-2"></span>
          No disponible
        </p>
        <p className="text-xs text-dark-light italic">
          * Se requiere mínimo 3 días de anticipación
        </p>
      </div>
    </div>
  )
}
