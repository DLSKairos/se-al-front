import { X, Plus, Camera, Image } from 'lucide-react'

export type TipoFoto = 'inicio_carga' | 'fin_carga' | 'item'

export interface FotoInventario {
  id: string
  tipo: TipoFoto
  url: string
  item_id?: string
}

interface GaleriaFotosProps {
  fotos: FotoInventario[]
  onAgregarFoto: (tipo: TipoFoto, archivo: File) => void
  onEliminarFoto: (fotoId: string) => void
  mostrarTipos?: TipoFoto[]
}

const etiquetasTipo: Record<TipoFoto, string> = {
  inicio_carga: 'Fotos Inicio de Carga',
  fin_carga: 'Fotos Fin de Carga',
  item: 'Fotos de Ítems',
}

interface SeccionFotosProps {
  tipo: TipoFoto
  fotos: FotoInventario[]
  onAgregarFoto: (tipo: TipoFoto, archivo: File) => void
  onEliminarFoto: (fotoId: string) => void
}

function SeccionFotos({ tipo, fotos, onAgregarFoto, onEliminarFoto }: SeccionFotosProps) {
  const abrirCamara = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onAgregarFoto(tipo, file)
    }
    input.click()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-white/40" aria-hidden="true" />
          <h4 className="text-sm font-['Syne'] font-semibold text-[var(--off-white)]">
            {etiquetasTipo[tipo]}
          </h4>
          {fotos.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-[var(--radius-badge)] bg-[var(--signal-dim)] text-[var(--signal)] text-[10px] font-['DM_Sans']">
              {fotos.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={abrirCamara}
          aria-label={`Agregar foto a ${etiquetasTipo[tipo]}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-btn)] bg-[var(--navy-light)] border border-white/10 text-white/60 text-xs font-['DM_Sans'] hover:border-[var(--signal)]/30 hover:text-[var(--signal)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Agregar
        </button>
      </div>

      {fotos.length === 0 ? (
        <button
          type="button"
          onClick={abrirCamara}
          className="flex flex-col items-center justify-center gap-2 h-24 rounded-[var(--radius-glass-md)] border border-dashed border-white/10 bg-[var(--navy-light)] text-white/20 hover:border-[var(--signal)]/20 hover:text-white/40 transition-colors"
        >
          <Image className="w-6 h-6" aria-hidden="true" />
          <span className="text-xs font-['DM_Sans']">Sin fotos — toca para agregar</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {fotos.map(foto => (
            <div key={foto.id} className="relative aspect-square rounded-[var(--radius-btn)] overflow-hidden bg-[var(--navy-light)] border border-white/10 group">
              <img
                src={foto.url}
                alt="Foto del acta"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" aria-hidden="true" />
              <button
                type="button"
                onClick={() => onEliminarFoto(foto.id)}
                aria-label="Eliminar foto"
                className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          ))}

          {/* Botón + inline */}
          <button
            type="button"
            onClick={abrirCamara}
            aria-label="Agregar otra foto"
            className="aspect-square rounded-[var(--radius-btn)] border border-dashed border-white/10 bg-[var(--navy-light)] flex items-center justify-center text-white/20 hover:border-[var(--signal)]/20 hover:text-white/40 transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export function GaleriaFotos({
  fotos,
  onAgregarFoto,
  onEliminarFoto,
  mostrarTipos = ['inicio_carga', 'fin_carga'],
}: GaleriaFotosProps) {
  const tiposAMostrar = mostrarTipos.filter(t => t !== 'item')

  return (
    <div className="flex flex-col gap-6">
      {tiposAMostrar.map(tipo => (
        <SeccionFotos
          key={tipo}
          tipo={tipo}
          fotos={fotos.filter(f => f.tipo === tipo)}
          onAgregarFoto={onAgregarFoto}
          onEliminarFoto={onEliminarFoto}
        />
      ))}
    </div>
  )
}
