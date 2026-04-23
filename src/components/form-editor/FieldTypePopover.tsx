import { useEffect, useRef, useState } from 'react'
import * as icons from 'lucide-react'
import { FieldType } from '@/types'
import {
  ALL_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  FIELD_TYPE_ICON_NAMES,
} from '@/utils/fieldType.utils'

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
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function handleSelect(type: FieldType) {
    onChange(type)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div onClick={() => setOpen((prev) => !prev)} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-[var(--navy-mid)] border border-[rgba(0,212,255,0.15)] rounded-lg shadow-xl p-1 w-48 z-50"
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
                    ? 'bg-[rgba(0,212,255,0.12)] text-[var(--signal)]'
                    : 'hover:bg-[rgba(0,212,255,0.08)] text-[var(--off-white)]'
                }`}
              >
                <DynamicIcon
                  name={FIELD_TYPE_ICON_NAMES[type]}
                  size={14}
                  className={isActive ? 'text-[var(--signal)]' : 'text-[var(--muted)]'}
                />
                <span>{FIELD_TYPE_LABELS[type]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { DynamicIcon }
