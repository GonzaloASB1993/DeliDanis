import type { Metadata } from 'next'
import { B2BNavbar } from '@/components/b2b/B2BNavbar'

export const metadata: Metadata = {
  title: 'DeliDanis B2B - Portal Mayorista',
}

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-light-alt">
      <B2BNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
