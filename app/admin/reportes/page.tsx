'use client'

import { useState } from 'react'
import { Header } from '@/components/admin/Header'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const tabs = [
  { id: 'resumen', label: 'Resumen Ejecutivo', icon: '📊' },
  { id: 'financiero', label: 'Análisis Financiero', icon: '📈' },
  { id: 'clientes', label: 'Clientes Top', icon: '👥' },
  { id: 'operaciones', label: 'Operaciones', icon: '🏭' },
  { id: 'mermas', label: 'Resumen de Mermas', icon: '📉' },
  { id: 'resultados', label: 'Estado de Resultados', icon: '🏦' },
]

export default function ReportesPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [activeTab, setActiveTab] = useState('resumen')

  return (
    <div className="min-h-screen">
      <Header
        title="Reportes Financieros"
        actions={
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-secondary text-dark-light hover:text-dark transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Excel
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filtros de fecha */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-dark-light mb-1">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-dark-light mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <p className="text-dark-light self-end pb-2">
            Mostrando datos de {MONTHS[selectedMonth - 1]} de {selectedYear}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Ingresos del Mes</p>
                <p className="text-xl font-bold text-green-600 mt-1">$572.000</p>
                <p className="text-xs text-dark-light">{MONTHS[selectedMonth - 1]} de {selectedYear}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Total Pagado</p>
                <p className="text-xl font-bold text-cyan-600 mt-1">$20.000</p>
                <p className="text-xs text-dark-light">Pagos recibidos</p>
              </div>
              <div className="p-2 bg-cyan-100 rounded-full text-cyan-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Saldo por Cobrar</p>
                <p className="text-xl font-bold text-red-500 mt-1">$552.000</p>
                <p className="text-xs text-dark-light">Pendiente de pago</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full text-red-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Eventos Realizados</p>
                <p className="text-xl font-bold text-blue-600 mt-1">3</p>
                <p className="text-xs text-dark-light">Mes seleccionado</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Utilidad del Mes</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">$572.000</p>
                <p className="text-xs text-dark-light">Ganancia neta</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-light text-sm">Próximos Eventos</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">0</p>
                <p className="text-xs text-dark-light">Próximos 7 días</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de stock */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full text-orange-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-orange-800">Items con Stock Bajo</p>
              <p className="text-orange-600 text-2xl font-bold">17</p>
              <p className="text-orange-700 text-sm">Requiere atención</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="border-b border-border">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-dark-light border-transparent hover:text-dark hover:border-border'
                  )}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'resumen' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de tendencia */}
                <div className="bg-secondary rounded-xl p-6">
                  <h3 className="font-semibold text-dark mb-4">Tendencia Mensual - Ingresos vs Gastos</h3>
                  <div className="h-64 flex items-center justify-center text-dark-light">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>Gráfico de líneas próximamente</p>
                    </div>
                  </div>
                </div>

                {/* Gráfico de distribución */}
                <div className="bg-secondary rounded-xl p-6">
                  <h3 className="font-semibold text-dark mb-4">Distribución de Servicios - Ingresos por Categoría</h3>
                  <div className="h-64 flex items-center justify-center text-dark-light">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                      <p>Gráfico de torta próximamente</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'resumen' && (
              <div className="text-center py-12 text-dark-light">
                <p>Contenido de {tabs.find(t => t.id === activeTab)?.label} próximamente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
