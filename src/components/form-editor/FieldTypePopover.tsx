import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as icons from 'lucide-react'
import { FieldType } from '@/types'
import {
  ALL_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  FIELD_TYPE_ICON_NAMES,
} from '@/utils/fieldType.utils'
import { useClickOutside } from '@/hooks/useClickOutside'

// ── DynamicIcon ────────────────────────────────────────────────────────────────

interface DynamicIconProps {
  name: string
  size?: number
  className?: string
}

function DynamicIcon({ name, size = 14, className }: DynamicIconProps) {
  const Icon = (icons as Record<string, any>)[name]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

// ── FieldTypePopover ───────────────────────────────────────────────────────────

interface FieldTypePopoverProps {
  currentType: FieldType
  onChange: (type: FieldType) => void
  children: React.ReactNode
}

export function FieldTypePopover({
  currentType,
  onChange,
  children,
}: FieldTypePopoverProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(true)
  }

  // Ajusta la posición vertical si el menú se sale por abajo de la pantalla
  useEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return
    const menuRect = menuRef.current.getBoundingClientRect()
    const triggerRect = triggerRef.current.getBoundingClientRect()
    if (menuRect.bottom > window.innerHeight - 8) {
      setMenuPos({ top: triggerRect.top - menuRect.height - 4, left: triggerRect.left })
    }
  }, [open])

  // El menú está portado fuera del árbol DOM del trigger, así que el hook
  // (basado solo en menuRef) no necesita revisar el trigger: éste detiene
  // la propagación de su propio mousedown (ver más abajo).
  useClickOutside(menuRef, () => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    function handleClose(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleClose)
    document.addEventListener('scroll', () => setOpen(false), { capture: true, once: true })
    return () => {
      document.removeEventListener('keydown', handleClose)
    }
  }, [open])

  function handleSelect(type: FieldType) {
    onChange(type)
    setOpen(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onClick={openMenu}
        onMouseDown={(e) => e.stopPropagation()}
        className="cursor-pointer"
      >
        {children}
      </div>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="glass-card-md p-1 w-48"
          role="listbox"
          aria-label="Seleccionar tipo de campo"
        >
          {ALL_FIELD_TYPES.map((type) => {
            const isActive = type === currentType
            return (
              <button
                key={type}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(type)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors text-left ${
                  isActive
                    ? 'bg-[var(--wash-brand)] text-[var(--accent-ink)]'
                    : 'hover:bg-[var(--wash)] text-[var(--off-white)]'
                }`}
              >
                <DynamicIcon
                  name={FIELD_TYPE_ICON_NAMES[type]}
                  size={14}
                  className={isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--muted)]'}
                />
                <span>{FIELD_TYPE_LABELS[type]}</span>
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}

export { DynamicIcon }
