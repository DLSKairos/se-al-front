import { Outlet } from 'react-router-dom'
import { SlowConnectionBanner } from '@/components/ui/SlowConnectionBanner'
import { BottomNav } from '@/components/layout/BottomNav'

export function OperatorLayout() {
  return (
    <div className="min-h-screen bg-[var(--navy)] flex flex-col">
      <SlowConnectionBanner />
      <main className="flex-1 flex flex-col pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
