import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  // Colapsar sidebar automaticamente en movil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCollapsed(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-[var(--navy)] overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
