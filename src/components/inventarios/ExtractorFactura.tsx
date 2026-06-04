import { useState } from 'react'
import { Camera, Paperclip, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, FileText } from 'lucide-react'
import type { DatosFacturaExtraida } from '@/types'

export type { DatosFacturaExtraida }

interface ExtractorFacturaProps {
  onExtraccionCompleta: (datos: DatosFacturaExtraida) => void
  onSaltarExtraccion: () => void
  onProcesarConIA?: (file: File) => Promise<DatosFacturaExtraida | null>
}

type EstadoExtractor = 'inicial' | 'preview' | 'cargando' | 'resultado' | 'error'

export function ExtractorFactura({ onExtraccionCompleta, onSaltarExtraccion, onProcesarConIA }: ExtractorFacturaProps) {
  const [estado, setEstado] = useState<EstadoExtractor>('inicial')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [datosExtraidos, setDatosExtraidos] = useState<DatosFacturaExtraida | null>(null)
  const esPdf = archivoSeleccionado?.type === 'application/pdf'

  const handleArchivoSeleccionado = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    setArchivoSeleccionado(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setEstado('preview')
  }

  const abrirCamara = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = handleArchivoSeleccionado
    input.click()
  }

  const abrirSelectorArchivo = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,application/pdf'
    input.onchange = handleArchivoSeleccionado
    input.click()
  }

  const procesarConIA = async () => {
    if (!archivoSeleccionado || !onProcesarConIA) return
    setEstado('cargando')
    try {
      const datos = await onProcesarConIA(archivoSeleccionado)
      if (datos) {
        setDatosExtraidos(datos)
        setEstado('resultado')
      } else {
        setEstado('error')
      }
    } catch {
      setEstado('error')
    }
  }

  const resetear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setArchivoSeleccionado(null)
    setDatosExtraidos(null)
    setEstado('inicial')
  }

  // Estado: Inicial
  if (estado === 'inicial') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--signal-dim)] mb-1">
            <Sparkles className="w-7 h-7 text-[var(--signal)]" aria-hidden="true" />
          </div>
          <h3 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            Extracción automática con IA
          </h3>
          <p className="text-sm text-white/50 font-['DM_Sans'] max-w-xs">
            Sube la factura en PDF o fotografíala, y la IA completará los datos automáticamente.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={abrirCamara}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-[var(--radius-btn)] font-['Syne'] font-semibold text-[var(--navy)] text-sm transition-all duration-150 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #0096b3)', boxShadow: '0 0 24px rgba(0,212,255,0.4)' }}
          >
            <Camera className="w-5 h-5" aria-hidden="true" />
            Fotografiar factura
          </button>

          <button
            type="button"
            onClick={abrirSelectorArchivo}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-[var(--radius-btn)] font-['Syne'] font-semibold text-[var(--signal)] text-sm border border-[var(--signal)]/30 bg-[var(--signal-dim)] hover:border-[var(--signal)]/60 transition-all duration-150 active:scale-[0.97]"
          >
            <Paperclip className="w-5 h-5" aria-hidden="true" />
            Subir PDF o imagen
          </button>
        </div>

        <button
          type="button"
          onClick={onSaltarExtraccion}
          className="text-xs text-white/30 hover:text-white/60 font-['DM_Sans'] transition-colors underline underline-offset-2"
        >
          Continuar sin extracción IA
        </button>
      </div>
    )
  }

  // Estado: Preview
  if (estado === 'preview') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="relative rounded-[var(--radius-glass-md)] overflow-hidden bg-[var(--navy-light)] border border-white/10">
          {esPdf ? (
            <div className="flex flex-col items-center gap-3 py-8 px-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--signal-dim)]">
                <FileText className="w-7 h-7 text-[var(--signal)]" aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="text-sm font-['Syne'] font-semibold text-[var(--off-white)] truncate max-w-[200px]">
                  {archivoSeleccionado?.name}
                </p>
                <p className="text-xs text-white/40 font-['DM_Sans'] mt-0.5">
                  {archivoSeleccionado ? (archivoSeleccionado.size / 1024).toFixed(0) : 0} KB · PDF
                </p>
              </div>
            </div>
          ) : (
            previewUrl && (
              <img
                src={previewUrl}
                alt="Vista previa de la factura"
                className="w-full max-h-64 object-contain"
              />
            )
          )}
          <div className={`${esPdf ? '' : 'absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent'} p-2 flex justify-end`}>
            <button
              type="button"
              onClick={resetear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-btn)] bg-white/10 backdrop-blur-sm text-white/80 text-xs font-['DM_Sans'] hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Cambiar archivo
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={procesarConIA}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-btn)] font-['Syne'] font-semibold text-[var(--navy)] text-sm transition-all duration-150 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #00D4FF, #0096b3)', boxShadow: '0 0 20px rgba(0,212,255,0.35)' }}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Analizar con IA
        </button>
      </div>
    )
  }

  // Estado: Cargando
  if (estado === 'cargando') {
    return (
      <div className="flex flex-col items-center gap-5 py-10 px-4">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--signal-dim)] border-t-[var(--signal)] animate-spin" aria-hidden="true" />
          <Sparkles className="w-6 h-6 text-[var(--signal)]" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-['Syne'] font-semibold text-[var(--off-white)] text-sm">
            Analizando factura con IA...
          </p>
          <p className="text-xs text-white/40 font-['DM_Sans']">
            Esto puede tomar unos segundos
          </p>
        </div>

        {/* Skeleton de ítems */}
        <div className="w-full max-w-sm flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded-[var(--radius-btn)] bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Estado: Resultado exitoso
  if (estado === 'resultado' && datosExtraidos) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-btn)] bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-emerald-400 font-['DM_Sans']">
            <span className="font-semibold">{(datosExtraidos.items ?? []).length} ítems detectados</span> automáticamente
          </span>
        </div>

        <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-btn)] bg-[var(--signal-dim)] border border-[var(--signal)]/20">
          <Sparkles className="w-3.5 h-3.5 text-[var(--signal)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-[var(--signal)] font-['DM_Sans']">
            Los campos marcados en verde fueron completados automáticamente
          </p>
        </div>

        {/* Resumen de cabecera extraída */}
        {(datosExtraidos.proveedor || datosExtraidos.numero_factura || datosExtraidos.fecha_factura) && (
          <div className="bg-[var(--navy-light)] rounded-[var(--radius-glass-md)] border border-white/10 px-3 py-2.5 flex flex-col gap-1">
            {datosExtraidos.proveedor && (
              <div className="flex justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">Proveedor</span>
                <span className="text-xs text-[var(--off-white)] font-['DM_Sans'] text-right truncate max-w-[180px]">{datosExtraidos.proveedor}</span>
              </div>
            )}
            {datosExtraidos.numero_factura && (
              <div className="flex justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">N° Factura</span>
                <span className="text-xs text-[var(--off-white)] font-['DM_Sans']">{datosExtraidos.numero_factura}</span>
              </div>
            )}
            {datosExtraidos.fecha_factura && (
              <div className="flex justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">Fecha</span>
                <span className="text-xs text-[var(--off-white)] font-['DM_Sans']">{datosExtraidos.fecha_factura}</span>
              </div>
            )}
            {datosExtraidos.total_factura != null && (
              <div className="flex justify-between gap-2 pt-1 mt-0.5 border-t border-white/10">
                <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">Total</span>
                <span className="text-xs text-[var(--signal)] font-['DM_Sans'] font-semibold">
                  {datosExtraidos.moneda ?? ''} {datosExtraidos.total_factura.toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tabla compacta de ítems extraídos */}
        <div className="bg-[var(--navy-light)] rounded-[var(--radius-glass-md)] border border-white/10 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 px-3 py-1.5 border-b border-white/10">
            <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">#</span>
            <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">Descripción</span>
            <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">Cant.</span>
            <span className="text-[10px] uppercase tracking-wide text-white/30 font-['DM_Sans']">Total</span>
          </div>
          <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
            {(datosExtraidos.items ?? []).map((item, idx) => (
              <div key={idx} className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 px-3 py-2 items-center">
                <span className="text-xs text-white/30 font-['DM_Sans'] w-5">{idx + 1}</span>
                <div className="min-w-0">
                  <span className="text-xs text-[var(--off-white)] font-['DM_Sans'] truncate block">{item.descripcion}</span>
                  {item.codigo && <span className="text-[10px] text-white/30 font-['DM_Sans']">{item.codigo}</span>}
                </div>
                <span className="text-xs text-white/50 font-['DM_Sans']">{item.cantidad ?? '—'}</span>
                <span className="text-xs text-white/50 font-['DM_Sans']">
                  {item.valor_total != null ? item.valor_total.toLocaleString('es-CO') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onExtraccionCompleta(datosExtraidos)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-btn)] font-['Syne'] font-semibold text-[var(--navy)] text-sm transition-all duration-150 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #0096b3)', boxShadow: '0 0 20px rgba(0,212,255,0.35)' }}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Usar estos datos
          </button>
          <button
            type="button"
            onClick={onSaltarExtraccion}
            className="w-full py-2.5 rounded-[var(--radius-btn)] font-['DM_Sans'] text-white/50 text-sm border border-white/10 bg-[var(--navy-light)] hover:border-white/20 transition-colors"
          >
            Rellenar manualmente
          </button>
        </div>
      </div>
    )
  }

  // Estado: Error
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius-btn)] bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-amber-400 font-['Syne'] font-semibold">
            No se pudo extraer automáticamente
          </p>
          <p className="text-xs text-amber-400/70 font-['DM_Sans']">
            La imagen no tiene suficiente calidad o el formato no es reconocible. Los campos quedarán en blanco para llenar manualmente.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={resetear}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-btn)] font-['DM_Sans'] font-medium text-[var(--signal)] text-sm border border-[var(--signal)]/30 bg-[var(--signal-dim)] hover:border-[var(--signal)]/60 transition-colors"
        >
          <Camera className="w-4 h-4" aria-hidden="true" />
          Intentar con otra imagen
        </button>
        <button
          type="button"
          onClick={onSaltarExtraccion}
          className="w-full py-2.5 rounded-[var(--radius-btn)] font-['DM_Sans'] text-white/50 text-sm border border-white/10 bg-[var(--navy-light)] hover:border-white/20 transition-colors"
        >
          Continuar sin extracción
        </button>
      </div>
    </div>
  )
}
