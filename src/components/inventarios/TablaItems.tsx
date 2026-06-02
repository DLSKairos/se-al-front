import { useState } from 'react'
import { Plus, Minus, Camera, Trash2, ChevronDown, ChevronUp, Scan, Sparkles, PackagePlus } from 'lucide-react'

export interface AccesorioItem {
  id: string
  parte_no: string
  pais: string
  descripcion: string
  marca: string
  modelo: string
}

export interface ItemInventario {
  id: string
  numero: number
  parte_no: string
  pais: string
  descripcion: string
  marca: string
  modelo: string
  serial: string
  cantidad: number
  extraido_por_ia: boolean
  accesorios: AccesorioItem[]
  fotos_count: number
}

interface TablaItemsProps {
  items: ItemInventario[]
  onItemChange: (itemId: string, campo: keyof ItemInventario, valor: unknown) => void
  onAgregarItem: () => void
  onEliminarItem: (itemId: string) => void
  onAgregarAccesorio: (itemId: string) => void
  onTomarFotoItem: (itemId: string) => void
  onScanearSerial: (itemId: string) => void
}

interface CampoItemProps {
  label: string
  value: string
  esIA?: boolean
  placeholder?: string
  onChange: (v: string) => void
}

function CampoItem({ label, value, esIA, placeholder, onChange }: CampoItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] uppercase tracking-wide text-white/40 font-['DM_Sans']">
          {label}
        </label>
        {esIA && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[var(--radius-badge)] bg-[var(--signal-dim)] border border-[var(--signal)]/20 text-[var(--signal)] text-[9px] font-['DM_Sans']">
            <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
            IA
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={[
          "w-full bg-[var(--navy)] border rounded-[var(--radius-input)] px-3 py-2 text-[var(--off-white)] placeholder-white/20 text-sm font-['DM_Sans'] focus:outline-none transition-colors",
          esIA
            ? 'border-emerald-500/30 focus:border-emerald-500/60 text-emerald-300'
            : 'border-white/10 focus:border-[var(--signal)]/50',
        ].join(' ')}
      />
    </div>
  )
}

interface AccesorioCardProps {
  accesorio: AccesorioItem
  numero: number
}

function AccesorioCard({ accesorio, numero }: AccesorioCardProps) {
  return (
    <div className="bg-[var(--navy)] rounded-[var(--radius-btn)] border border-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans'] mb-2">
        Accesorio {numero}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(['parte_no', 'pais', 'descripcion', 'marca', 'modelo'] as const).map(campo => (
          <div key={campo} className={campo === 'descripcion' ? 'col-span-2' : ''}>
            <p className="text-[10px] text-white/30 font-['DM_Sans'] mb-0.5 capitalize">
              {campo.replace('_', ' ')}
            </p>
            <p className="text-xs text-[var(--off-white)] font-['DM_Sans'] truncate">
              {accesorio[campo] || '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ItemCardProps {
  item: ItemInventario
  onChange: (campo: keyof ItemInventario, valor: unknown) => void
  onEliminar: () => void
  onAgregarAccesorio: () => void
  onTomarFoto: () => void
  onScanearSerial: () => void
}

function ItemCard({ item, onChange, onEliminar, onAgregarAccesorio, onTomarFoto, onScanearSerial }: ItemCardProps) {
  const [expandido, setExpandido] = useState(true)
  const [accesoriosAbiertos, setAccesoriosAbiertos] = useState(false)

  return (
    <div className="bg-[var(--navy-mid)] border border-white/10 rounded-[var(--radius-glass-md)] overflow-hidden">
      {/* Header del ítem */}
      <button
        type="button"
        onClick={() => setExpandido(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
        aria-expanded={expandido}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-6 h-6 rounded-full text-[var(--navy)] text-xs font-['Syne'] font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #0096b3)' }}
          >
            {item.numero}
          </span>
          <span className="text-sm font-['Syne'] text-[var(--off-white)] truncate max-w-[180px]">
            {item.descripcion || `Ítem ${item.numero}`}
          </span>
          {item.extraido_por_ia && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[var(--radius-badge)] bg-[var(--signal-dim)] border border-[var(--signal)]/20 text-[var(--signal)] text-[9px] font-['DM_Sans'] flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
              IA
            </span>
          )}
          {item.fotos_count > 0 && (
            <span className="text-[10px] text-white/30 font-['DM_Sans'] flex-shrink-0">
              {item.fotos_count} foto{item.fotos_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {expandido
          ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" aria-hidden="true" />
          : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" aria-hidden="true" />
        }
      </button>

      {expandido && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Campos en grid */}
          <div className="grid grid-cols-2 gap-3">
            <CampoItem
              label="Parte No."
              value={item.parte_no}
              esIA={item.extraido_por_ia}
              placeholder="P/N"
              onChange={v => onChange('parte_no', v)}
            />
            <CampoItem
              label="País"
              value={item.pais}
              esIA={item.extraido_por_ia}
              placeholder="CO"
              onChange={v => onChange('pais', v)}
            />
            <div className="col-span-2">
              <CampoItem
                label="Descripción"
                value={item.descripcion}
                esIA={item.extraido_por_ia}
                placeholder="Descripción del ítem"
                onChange={v => onChange('descripcion', v)}
              />
            </div>
            <CampoItem
              label="Marca"
              value={item.marca}
              placeholder="Marca"
              onChange={v => onChange('marca', v)}
            />
            <CampoItem
              label="Modelo"
              value={item.modelo}
              placeholder="Modelo"
              onChange={v => onChange('modelo', v)}
            />

            {/* Campo Serial con ícono de scanner */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide text-white/40 font-['DM_Sans']">
                Serial
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={item.serial}
                  placeholder="S/N o escanear"
                  onChange={e => onChange('serial', e.target.value)}
                  className="w-full bg-[var(--navy)] border border-white/10 rounded-[var(--radius-input)] pl-3 pr-10 py-2 text-[var(--off-white)] placeholder-white/20 text-sm font-['DM_Sans'] focus:outline-none focus:border-[var(--signal)]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={onScanearSerial}
                  aria-label="Escanear serial"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-white/30 hover:text-[var(--signal)] transition-colors"
                >
                  <Scan className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Cantidad con +/- */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide text-white/40 font-['DM_Sans']">
                Cantidad
              </label>
              <div className="flex items-center gap-0">
                <button
                  type="button"
                  onClick={() => onChange('cantidad', Math.max(0, item.cantidad - 1))}
                  aria-label="Disminuir cantidad"
                  className="flex items-center justify-center w-10 h-10 rounded-l-[var(--radius-input)] bg-[var(--navy)] border border-white/10 text-white/50 hover:text-[var(--signal)] hover:border-[var(--signal)]/30 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <input
                  type="number"
                  value={item.cantidad}
                  min={0}
                  onChange={e => onChange('cantidad', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 h-10 bg-[var(--navy)] border-y border-white/10 text-[var(--off-white)] text-sm font-['DM_Sans'] text-center focus:outline-none focus:border-[var(--signal)]/50 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => onChange('cantidad', item.cantidad + 1)}
                  aria-label="Aumentar cantidad"
                  className="flex items-center justify-center w-10 h-10 rounded-r-[var(--radius-input)] bg-[var(--navy)] border border-white/10 text-white/50 hover:text-[var(--signal)] hover:border-[var(--signal)]/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Accesorios */}
          {item.accesorios.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setAccesoriosAbiertos(v => !v)}
                className="flex items-center gap-1.5 text-xs text-white/40 font-['DM_Sans'] hover:text-white/60 transition-colors mb-2"
              >
                {accesoriosAbiertos
                  ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                }
                {item.accesorios.length} accesorio{item.accesorios.length > 1 ? 's' : ''}
              </button>
              {accesoriosAbiertos && (
                <div className="flex flex-col gap-2">
                  {item.accesorios.map((acc, idx) => (
                    <AccesorioCard key={acc.id} accesorio={acc} numero={idx + 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Acciones del ítem */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <button
              type="button"
              onClick={onTomarFoto}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-btn)] bg-[var(--navy-light)] border border-white/10 text-white/60 text-xs font-['DM_Sans'] hover:border-white/20 hover:text-white/80 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              Foto
              {item.fotos_count > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[var(--signal-dim)] text-[var(--signal)] text-[9px]">
                  {item.fotos_count}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onAgregarAccesorio}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-btn)] bg-[var(--navy-light)] border border-white/10 text-white/60 text-xs font-['DM_Sans'] hover:border-white/20 hover:text-white/80 transition-colors"
            >
              <PackagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              Accesorio
            </button>

            <button
              type="button"
              onClick={onEliminar}
              aria-label="Eliminar ítem"
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-btn)] bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-['DM_Sans'] hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TablaItems({
  items,
  onItemChange,
  onAgregarItem,
  onEliminarItem,
  onAgregarAccesorio,
  onTomarFotoItem,
  onScanearSerial,
}: TablaItemsProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 bg-[var(--navy-mid)] border border-dashed border-white/10 rounded-[var(--radius-glass-md)]">
          <PackagePlus className="w-8 h-8 text-white/20" aria-hidden="true" />
          <p className="text-sm text-white/30 font-['DM_Sans']">
            No hay ítems. Agrega el primero.
          </p>
        </div>
      )}

      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          onChange={(campo, valor) => onItemChange(item.id, campo, valor)}
          onEliminar={() => onEliminarItem(item.id)}
          onAgregarAccesorio={() => onAgregarAccesorio(item.id)}
          onTomarFoto={() => onTomarFotoItem(item.id)}
          onScanearSerial={() => onScanearSerial(item.id)}
        />
      ))}

      <button
        type="button"
        onClick={onAgregarItem}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[var(--radius-glass-md)] border border-dashed border-[var(--signal)]/30 bg-[var(--signal-dim)] text-[var(--signal)] text-sm font-['Syne'] font-medium hover:border-[var(--signal)]/60 hover:bg-[var(--signal)]/10 transition-all duration-150 active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        Agregar ítem
      </button>
    </div>
  )
}
