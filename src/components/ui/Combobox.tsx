import {
  useState,
  useRef,
  useEffect,
  useId,
  KeyboardEvent,
} from 'react'
import { Search, ChevronDown, PlusCircle, X } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ComboboxItem {
  id: string
  name: string
}

export interface ComboboxProps {
  /** Lista de items disponibles */
  items: ComboboxItem[]
  /** ID del item seleccionado (null = sin selección) */
  value: string | null
  /** Callback al cambiar selección */
  onChange: (id: string | null) => void
  /** Placeholder del campo de búsqueda */
  placeholder?: string
  /** Mientras true → muestra skeleton; nunca texto vacío */
  loading?: boolean
  /** Si se provee, aparece la opción "No encuentro mi [suggestLabel]" */
  onSuggest?: (text: string) => void
  /** Nombre del tipo de item para el mensaje de sugerencia (ej: "cargo") */
  suggestLabel?: string
  /** Etiqueta del campo (label visible) */
  label?: string
  /** Mensaje de error bajo el campo */
  error?: string
}

// ── Constantes ────────────────────────────────────────────────────────────────

const LISTBOX_MAX_HEIGHT = 240 // px

// ── Subcomponente: skeleton ───────────────────────────────────────────────────

function ComboboxSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
      )}
      <div
        className="h-12 w-full rounded-[var(--radius-input)] animate-pulse"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * Combobox accesible con búsqueda incremental, navegación por teclado y
 * opción de sugerir un valor nuevo al administrador.
 *
 * - Teclado: flechas ↑↓ navegan la lista, Enter selecciona, Escape cierra.
 * - aria-*: role="combobox", aria-expanded, aria-activedescendant, aria-controls.
 * - loading → skeleton (NUNCA campo vacío ni "Selecciona...").
 * - Con onSuggest y sin resultados: opción "No encuentro mi [suggestLabel]".
 */
export default function Combobox({
  items,
  value,
  onChange,
  placeholder = 'Buscar...',
  loading = false,
  onSuggest,
  suggestLabel = 'elemento',
  label,
  error,
}: ComboboxProps) {
  const uid = useId()
  const inputId = `combobox-input-${uid}`
  const listId = `combobox-list-${uid}`

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Item seleccionado actualmente
  const selectedItem = items.find((i) => i.id === value) ?? null

  // Texto que muestra el trigger
  const displayText = selectedItem?.name ?? ''

  // Filtro por query
  const filtered = query.trim()
    ? items.filter((i) =>
        i.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : items

  const hasSuggestOption = !!onSuggest && filtered.length === 0 && query.trim().length > 0

  // Cierra al hacer click fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Scroll del item activo al campo visible
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const el = listRef.current.querySelector<HTMLLIElement>(
      `[data-idx="${activeIndex}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openDropdown() {
    setOpen(true)
    setQuery('')
    setActiveIndex(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function selectItem(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }

  function clearSelection(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const total = filtered.length + (hasSuggestOption ? 1 : 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? total - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        selectItem(filtered[activeIndex].id)
      } else if (activeIndex === filtered.length && hasSuggestOption) {
        onSuggest?.(query.trim())
        setOpen(false)
        setQuery('')
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      setActiveIndex(-1)
    }
  }

  // ── Render loading ────────────────────────────────────────────────────────

  if (loading) return <ComboboxSkeleton label={label} />

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-wide font-['DM_Sans'] mb-0"
          style={{ color: 'var(--muted)' }}
        >
          {label}
        </label>
      )}

      {/* Trigger — actúa como input cuando cerrado */}
      <button
        type="button"
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={openDropdown}
        className={[
          'w-full flex items-center gap-2 px-4 py-3 rounded-[var(--radius-input)] text-sm text-left',
          'transition-all outline-none',
          'bg-[rgba(255,255,255,0.05)] border',
          error
            ? 'border-red-500/60 focus:border-red-500'
            : open
            ? 'border-[var(--signal)] shadow-[0_0_0_2px_rgba(0,212,255,0.1)]'
            : 'border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.3)]',
        ].join(' ')}
      >
        <span
          className="flex-1 truncate font-['DM_Sans']"
          style={{ color: displayText ? 'var(--off-white)' : 'var(--muted)' }}
        >
          {displayText || placeholder}
        </span>

        {/* Botón limpiar */}
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Limpiar selección"
            onMouseDown={clearSelection}
            onKeyDown={(e) => e.key === 'Enter' && clearSelection(e as unknown as React.MouseEvent)}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          </span>
        )}

        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{
            color: 'var(--muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Mensaje de error */}
      {error && (
        <p className="text-xs font-['DM_Sans'] mt-0.5" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-[var(--radius-glass-md)] border overflow-hidden"
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid rgba(0,212,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Campo de búsqueda */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-b"
            style={{ borderColor: 'rgba(0,212,255,0.1)' }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
            <input
              ref={inputRef}
              id={`${inputId}-search`}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(-1)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              aria-autocomplete="list"
              aria-controls={listId}
              className="flex-1 bg-transparent outline-none text-sm font-['DM_Sans'] placeholder:text-[var(--muted)]"
              style={{ color: 'var(--off-white)' }}
            />
          </div>

          {/* Lista de opciones */}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label ?? 'Opciones'}
            style={{ maxHeight: LISTBOX_MAX_HEIGHT, overflowY: 'auto' }}
          >
            {filtered.length === 0 && !hasSuggestOption && (
              <li
                className="px-4 py-3 text-sm font-['DM_Sans'] text-center"
                style={{ color: 'var(--muted)' }}
              >
                Sin resultados
              </li>
            )}

            {filtered.map((item, idx) => {
              const isActive = activeIndex === idx
              const isSelected = item.id === value
              return (
                <li
                  key={item.id}
                  data-idx={idx}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={() => selectItem(item.id)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className="px-4 py-2.5 text-sm font-['DM_Sans'] cursor-pointer transition-colors flex items-center justify-between gap-2"
                  style={{
                    background: isActive
                      ? 'rgba(0,212,255,0.08)'
                      : isSelected
                      ? 'rgba(0,212,255,0.05)'
                      : 'transparent',
                    color: isSelected ? 'var(--signal)' : 'var(--off-white)',
                  }}
                >
                  <span className="truncate">{item.name}</span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              )
            })}

            {/* Opción de sugerencia */}
            {hasSuggestOption && (
              <li
                data-idx={filtered.length}
                role="option"
                aria-selected={false}
                onMouseDown={() => {
                  onSuggest?.(query.trim())
                  setOpen(false)
                  setQuery('')
                }}
                onMouseEnter={() => setActiveIndex(filtered.length)}
                className="px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 border-t"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background:
                    activeIndex === filtered.length
                      ? 'rgba(245,166,35,0.08)'
                      : 'transparent',
                  color: 'var(--amber)',
                }}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>
                  No encuentro mi {suggestLabel} &mdash; Sugerir al administrador
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
