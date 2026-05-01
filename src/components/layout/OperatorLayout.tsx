import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SlowConnectionBanner } from '@/components/ui/SlowConnectionBanner'
import { LiteModeBanner } from '@/components/ui/LiteModeBanner'
import { BottomNav } from '@/components/layout/BottomNav'

export function OperatorLayout() {
  const [showLiteBanner, setShowLiteBanner] = useState(
    !sessionStorage.getItem('lite_banner_dismissed') &&
    !sessionStorage.getItem('lite_mode'),
  )

  const handleLiteIgnore = () => {
    sessionStorage.setItem('lite_banner_dismissed', '1')
    setShowLiteBanner(false)
  }

  const handleLiteActivate = () => {
    sessionStorage.setItem('lite_mode', 'true')
    sessionStorage.setItem('lite_banner_dismissed', '1')
    setShowLiteBanner(false)
  }

  return (
    <div className="min-h-screen bg-[var(--navy)] flex flex-col">
      <SlowConnectionBanner />
      <main className="flex-1 flex flex-col pb-20">
        <Outlet />
      </main>
      <BottomNav />
      {showLiteBanner && (
        <LiteModeBanner onIgnore={handleLiteIgnore} onActivate={handleLiteActivate} />
      )}
    </div>
  )
}
