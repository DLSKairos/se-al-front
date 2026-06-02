import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { inventariosApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  InventarioItem,
} from '@/types'
import type { DatosFacturaExtraida as DatosFacturaExtraidaComp } from '@/components/inventarios/ExtractorFactura'
import {
  StepperInventario,
  ExtractorFactura,
  CabeceraActaForm,
  TablaItems,
  GaleriaFotos,
  FirmasActa,
} from '@/components/inventarios'
import type { CabeceraActa } from '@/components/inventarios/CabeceraActaForm'
import type { ItemInventario } from '@/components/inventarios/TablaItems'
import type { FotoInventario, TipoFoto } from '@/components/inventarios/GaleriaFotos'
import type { FirmaData } from '@/components/inventarios/FirmasActa'
import { useToast } from '@/components/ui'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function generarIdLocal(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function itemInventarioDesdeApi(item: InventarioItem, numero: number): ItemInventario {
  return {
    id: item.id,
    numero,
    parte_no: item.parte_no ?? '',
    pais: item.pais ?? '',
    descripcion: item.descripcion ?? '',
    marca: item.marca ?? '',
    modelo: item.modelo ?? '',
    serial: item.serial ?? '',
    cantidad: item.cantidad ?? 0,
    extraido_por_ia: item.extraido_por_ia,
    accesorios: item.accesorios.map((a) => ({
      id: a.id,
      parte_no: a.parte_no ?? '',
      pais: a.pais ?? '',
      descripcion: a.descripcion ?? '',
      marca: a.marca ?? '',
      modelo: a.modelo ?? '',
    })),
    fotos_count: item.fotos?.length ?? 0,
  }
}

function itemVacioDesdeFactura(
  datos: DatosFacturaExtraidaComp['items'][number],
  numero: number,
): ItemInventario {
  return {
    id: generarIdLocal(),
    numero,
    parte_no: datos.codigo_arancelario ?? '',
    pais: datos.pais_origen ?? '',
    descripcion: datos.descripcion,
    marca: '',
    modelo: '',
    serial: '',
    cantidad: datos.cantidad ?? 0,
    extraido_por_ia: true,
    accesorios: [],
    fotos_count: 0,
  }
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function NuevaActaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [pasoActual, setPasoActual] = useState<1 | 2 | 3 | 4>(1)
  const [pasosCompletados, setPasosCompletados] = useState(new Set<number>())
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [datosFactura, setDatosFactura] = useState<DatosFacturaExtraidaComp | null>(null)
  const [cabecera, setCabecera] = useState<Partial<CabeceraActa>>({})
  const [items, setItems] = useState<ItemInventario[]>([])
  const [fotos, setFotos] = useState<FotoInventario[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [firmaDeposito, setFirmaDeposito] = useState<FirmaData>({ nombre: '', firma_url: null })
  const [firmaAgencia, setFirmaAgencia] = useState<FirmaData>({ nombre: '', firma_url: null })

  // Debounce refs para actualizaciones de items
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // ── Mutaciones ────────────────────────────────────────────────────────────

  const crearSesionMutation = useMutation({
    mutationFn: (data: Partial<Parameters<typeof inventariosApi.crearSesion>[0]>) =>
      inventariosApi.crearSesion(data).then((r) => r.data),
    onError: () => toast.error('No se pudo crear la sesión.'),
  })

  const actualizarSesionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof inventariosApi.actualizarSesion>[1] }) =>
      inventariosApi.actualizarSesion(id, data).then((r) => r.data),
    onError: () => toast.error('No se pudo guardar la sesión.'),
  })

  const agregarItemMutation = useMutation({
    mutationFn: ({ sessionId: sid, data }: { sessionId: string; data: Partial<InventarioItem> }) =>
      inventariosApi.agregarItem(sid, data).then((r) => r.data),
    onError: () => toast.error('No se pudo agregar el ítem.'),
  })

  const actualizarItemMutation = useMutation({
    mutationFn: ({
      sid,
      itemId,
      data,
    }: {
      sid: string
      itemId: string
      data: Partial<InventarioItem>
    }) => inventariosApi.actualizarItem(sid, itemId, data).then((r) => r.data),
  })

  const eliminarItemMutation = useMutation({
    mutationFn: ({ sid, itemId }: { sid: string; itemId: string }) =>
      inventariosApi.eliminarItem(sid, itemId),
    onError: () => toast.error('No se pudo eliminar el ítem.'),
  })

  const subirFotoMutation = useMutation({
    mutationFn: ({
      sid,
      tipo,
      file,
      itemId,
    }: {
      sid: string
      tipo: string
      file: File
      itemId?: string
    }) => inventariosApi.subirFoto(sid, tipo, file, itemId).then((r) => r.data),
    onError: () => toast.error('No se pudo subir la foto.'),
  })

  const eliminarFotoMutation = useMutation({
    mutationFn: ({ sid, fotoId }: { sid: string; fotoId: string }) =>
      inventariosApi.eliminarFoto(sid, fotoId),
    onError: () => toast.error('No se pudo eliminar la foto.'),
  })

  const completarActaMutation = useMutation({
    mutationFn: ({ id, obs }: { id: string; obs: string }) =>
      inventariosApi.actualizarSesion(id, { estado: 'completado', observaciones: obs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.inventarios.sesiones() })
      toast.success('Acta completada correctamente.')
      navigate('/inventarios')
    },
    onError: () => toast.error('No se pudo completar el acta.'),
  })

  // ── Paso 1 — Extracción de factura ────────────────────────────────────────

  const handleExtraccionCompleta = useCallback(
    (datos: DatosFacturaExtraidaComp) => {
      setDatosFactura(datos)
      if (datos.items.length > 0) {
        setItems(datos.items.map((item, idx) => itemVacioDesdeFactura(item, idx + 1)))
      }
      if (datos.consignatario) {
        setCabecera((prev) => ({ ...prev, consignatario: datos.consignatario! }))
      }
      setPasosCompletados((prev) => new Set(prev).add(1))
      setPasoActual(2)
    },
    [],
  )

  const handleProcesarConIA = useCallback(async (file: File) => {
    try {
      const res = await inventariosApi.extraerFactura(file)
      if (res.data?.success && res.data.data) return res.data.data
      return null
    } catch {
      return null
    }
  }, [])

  const handleSaltarExtraccion = useCallback(() => {
    setPasosCompletados((prev) => new Set(prev).add(1))
    setPasoActual(2)
  }, [])

  // ── Paso 2 — Cabecera ─────────────────────────────────────────────────────

  const handleCabeceraChange = useCallback(
    (campo: keyof CabeceraActa, valor: string | number | null) => {
      setCabecera((prev) => ({ ...prev, [campo]: valor }))
    },
    [],
  )

  const handleCabeceraSiguiente = useCallback(async () => {
    try {
      let sid = sessionId
      if (!sid) {
        const sesion = await crearSesionMutation.mutateAsync({
          ...cabecera,
          tipo_formulario: 'Acta de Inspección Previa',
          estado: 'borrador',
        })
        sid = sesion.id
        setSessionId(sid)

        // Sincronizar items extraídos con el backend
        if (items.length > 0) {
          const itemsCreados: ItemInventario[] = []
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const creado = await agregarItemMutation.mutateAsync({
              sessionId: sid,
              data: {
                parte_no: item.parte_no || null,
                pais: item.pais || null,
                descripcion: item.descripcion || null,
                marca: item.marca || null,
                modelo: item.modelo || null,
                serial: item.serial || null,
                cantidad: item.cantidad,
                extraido_por_ia: item.extraido_por_ia,
              },
            })
            itemsCreados.push(itemInventarioDesdeApi(creado, i + 1))
          }
          setItems(itemsCreados)
        }
      } else {
        await actualizarSesionMutation.mutateAsync({ id: sid, data: { ...cabecera } })
      }
      setPasosCompletados((prev) => new Set(prev).add(2))
      setPasoActual(3)
    } catch {
      // Error ya manejado por onError de la mutación
    }
  }, [
    sessionId,
    cabecera,
    items,
    crearSesionMutation,
    actualizarSesionMutation,
    agregarItemMutation,
  ])

  // ── Paso 3 — Ítems ────────────────────────────────────────────────────────

  const handleItemChange = useCallback(
    (itemId: string, campo: keyof ItemInventario, valor: unknown) => {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, [campo]: valor } : it)),
      )

      if (!sessionId || itemId.startsWith('local_')) return

      // Debounce la escritura al backend (500ms)
      const timer = debounceTimers.current.get(itemId)
      if (timer) clearTimeout(timer)
      const newTimer = setTimeout(() => {
        actualizarItemMutation.mutate({
          sid: sessionId,
          itemId,
          data: { [campo]: valor } as Partial<InventarioItem>,
        })
      }, 500)
      debounceTimers.current.set(itemId, newTimer)
    },
    [sessionId, actualizarItemMutation],
  )

  const handleAgregarItem = useCallback(async () => {
    const numero = items.length + 1
    if (!sessionId) {
      setItems((prev) => [
        ...prev,
        {
          id: generarIdLocal(),
          numero,
          parte_no: '',
          pais: '',
          descripcion: '',
          marca: '',
          modelo: '',
          serial: '',
          cantidad: 0,
          extraido_por_ia: false,
          accesorios: [],
          fotos_count: 0,
        },
      ])
      return
    }
    try {
      const creado = await agregarItemMutation.mutateAsync({
        sessionId,
        data: { extraido_por_ia: false, cantidad: 0 },
      })
      setItems((prev) => [...prev, itemInventarioDesdeApi(creado, numero)])
    } catch {
      // ya manejado
    }
  }, [sessionId, items.length, agregarItemMutation])

  const handleEliminarItem = useCallback(
    async (itemId: string) => {
      setItems((prev) => prev.filter((it) => it.id !== itemId))
      if (sessionId && !itemId.startsWith('local_')) {
        eliminarItemMutation.mutate({ sid: sessionId, itemId })
      }
    },
    [sessionId, eliminarItemMutation],
  )

  const handleAgregarAccesorio = useCallback((_itemId: string) => {
    // Los accesorios se gestionan en el backend; aquí solo es un placeholder visual
    toast.warning('Funcionalidad de accesorios disponible próximamente.')
  }, [toast])

  const handleTomarFotoItem = useCallback(
    async (itemId: string) => {
      if (!sessionId) {
        toast.warning('Guarda la cabecera antes de agregar fotos.')
        return
      }
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        try {
          const foto = await subirFotoMutation.mutateAsync({
            sid: sessionId,
            tipo: 'item',
            file,
            itemId,
          })
          const fotoLocal: FotoInventario = { id: foto.id, tipo: 'item', url: foto.url, item_id: foto.item_id ?? undefined }
          setFotos((prev) => [...prev, fotoLocal])
          setItems((prev) =>
            prev.map((it) =>
              it.id === itemId ? { ...it, fotos_count: it.fotos_count + 1 } : it,
            ),
          )
          toast.success('Foto agregada.')
        } catch {
          // ya manejado
        }
      }
      input.click()
    },
    [sessionId, subirFotoMutation, toast],
  )

  const handleScanearSerial = useCallback(
    (itemId: string) => {
      // Activa el listener de teclado para la pistola — el resultado llega via useBarcodeScanner
      toast.warning(`Escanea el serial del ítem ${itemId.slice(-4)} con la pistola.`)
    },
    [toast],
  )

  const handleBarcodeScan = useCallback(
    (codigo: string) => {
      // Buscar item con ese parte_no; si existe, incrementar cantidad; si no, agregar nuevo
      setItems((prev) => {
        const existente = prev.find((it) => it.parte_no === codigo)
        if (existente) {
          const actualizado = prev.map((it) =>
            it.id === existente.id ? { ...it, cantidad: it.cantidad + 1 } : it,
          )
          if (sessionId && !existente.id.startsWith('local_')) {
            actualizarItemMutation.mutate({
              sid: sessionId,
              itemId: existente.id,
              data: { cantidad: existente.cantidad + 1 } as Partial<InventarioItem>,
            })
          }
          return actualizado
        }
        // Nuevo item
        const numero = prev.length + 1
        const nuevoItem: ItemInventario = {
          id: generarIdLocal(),
          numero,
          parte_no: codigo,
          pais: '',
          descripcion: '',
          marca: '',
          modelo: '',
          serial: '',
          cantidad: 1,
          extraido_por_ia: false,
          accesorios: [],
          fotos_count: 0,
        }
        if (sessionId) {
          agregarItemMutation.mutate({
            sessionId,
            data: { parte_no: codigo, cantidad: 1, extraido_por_ia: false },
          })
        }
        return [...prev, nuevoItem]
      })
    },
    [sessionId, actualizarItemMutation, agregarItemMutation],
  )

  useBarcodeScanner(handleBarcodeScan, pasoActual === 3)

  const handleItemsSiguiente = useCallback(() => {
    setPasosCompletados((prev) => new Set(prev).add(3))
    setPasoActual(4)
  }, [])

  // ── Paso 4 — Cierre ───────────────────────────────────────────────────────

  const handleAgregarFoto = useCallback(
    async (tipo: TipoFoto, file: File) => {
      if (!sessionId) {
        toast.warning('Guarda la cabecera antes de agregar fotos.')
        return
      }
      try {
        const foto = await subirFotoMutation.mutateAsync({ sid: sessionId, tipo, file })
        const fotoLocal: FotoInventario = { id: foto.id, tipo, url: foto.url }
        setFotos((prev) => [...prev, fotoLocal])
        toast.success('Foto agregada.')
      } catch {
        // ya manejado
      }
    },
    [sessionId, subirFotoMutation, toast],
  )

  const handleEliminarFoto = useCallback(
    (fotoId: string) => {
      setFotos((prev) => prev.filter((f) => f.id !== fotoId))
      if (sessionId) {
        eliminarFotoMutation.mutate({ sid: sessionId, fotoId })
      }
    },
    [sessionId, eliminarFotoMutation],
  )

  const handleCompletarActa = useCallback(async () => {
    if (!sessionId) {
      toast.error('No hay sesión activa para completar.')
      return
    }

    // Guardar firmas si están completas
    try {
      if (firmaDeposito.firma_url || firmaAgencia.firma_url) {
        await inventariosApi.firmarSesion(sessionId, {
          ...(firmaDeposito.firma_url
            ? { deposito: { nombre: firmaDeposito.nombre, url: firmaDeposito.firma_url } }
            : {}),
          ...(firmaAgencia.firma_url
            ? { agencia: { nombre: firmaAgencia.nombre, url: firmaAgencia.firma_url } }
            : {}),
        })
      }
    } catch {
      // No bloqueamos si las firmas fallan
    }

    completarActaMutation.mutate({ id: sessionId, obs: observaciones })
  }, [sessionId, firmaDeposito, firmaAgencia, observaciones, completarActaMutation, toast])

  // ── Navegación entre pasos ────────────────────────────────────────────────

  const handlePasoClick = useCallback(
    (paso: number) => {
      if (pasosCompletados.has(paso) || paso <= pasoActual) {
        setPasoActual(paso as 1 | 2 | 3 | 4)
      }
    },
    [pasosCompletados, pasoActual],
  )

  const isCabeceraBusy =
    crearSesionMutation.isPending || actualizarSesionMutation.isPending || agregarItemMutation.isPending
  const isCompletarBusy = completarActaMutation.isPending

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-x-hidden bg-[var(--navy)] pb-24"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3 border-b border-white/5">
        <button
          type="button"
          onClick={() => navigate('/inventarios')}
          aria-label="Volver a inventarios"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--navy-light)] border border-white/10 text-white/60 hover:text-[var(--off-white)] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-['Syne'] font-bold text-base text-[var(--off-white)]">
            Nueva Acta de Inspección
          </h1>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center justify-center">
        <StepperInventario
          pasoActual={pasoActual}
          onPasoClick={handlePasoClick}
          pasosCompletados={pasosCompletados}
        />
      </div>

      {/* Contenido del paso */}
      <div className="flex-1 px-4 py-6">

        {/* Paso 1 — Factura */}
        {pasoActual === 1 && (
          <ExtractorFactura
            onExtraccionCompleta={handleExtraccionCompleta}
            onSaltarExtraccion={handleSaltarExtraccion}
            onProcesarConIA={handleProcesarConIA}
          />
        )}

        {/* Paso 2 — Cabecera */}
        {pasoActual === 2 && (
          <div className="flex flex-col gap-6">
            <CabeceraActaForm valores={cabecera} onChange={handleCabeceraChange} />
            <button
              type="button"
              onClick={handleCabeceraSiguiente}
              disabled={isCabeceraBusy}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[var(--radius-btn)] font-['Syne'] font-semibold text-[var(--navy)] text-sm transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #00D4FF, #0096b3)',
                boxShadow: '0 0 20px rgba(0,212,255,0.3)',
              }}
            >
              {isCabeceraBusy ? 'Guardando...' : 'Siguiente'}
            </button>
          </div>
        )}

        {/* Paso 3 — Ítems */}
        {pasoActual === 3 && (
          <div className="flex flex-col gap-6">
            <TablaItems
              items={items}
              onItemChange={handleItemChange}
              onAgregarItem={handleAgregarItem}
              onEliminarItem={handleEliminarItem}
              onAgregarAccesorio={handleAgregarAccesorio}
              onTomarFotoItem={handleTomarFotoItem}
              onScanearSerial={handleScanearSerial}
            />
            <button
              type="button"
              onClick={handleItemsSiguiente}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[var(--radius-btn)] font-['Syne'] font-semibold text-[var(--navy)] text-sm transition-all duration-150 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #00D4FF, #0096b3)',
                boxShadow: '0 0 20px rgba(0,212,255,0.3)',
              }}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Paso 4 — Cierre */}
        {pasoActual === 4 && (
          <div className="flex flex-col gap-8">
            <GaleriaFotos
              fotos={fotos}
              onAgregarFoto={handleAgregarFoto}
              onEliminarFoto={handleEliminarFoto}
              mostrarTipos={['inicio_carga', 'fin_carga']}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans']">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones generales del acta..."
                rows={4}
                className="w-full bg-[var(--navy)] border border-white/10 rounded-[var(--radius-input)] px-3 py-2.5 text-[var(--off-white)] placeholder-white/20 text-sm font-['DM_Sans'] focus:outline-none focus:border-[var(--signal)]/50 transition-colors resize-none"
              />
            </div>

            <FirmasActa
              firmaDeposito={firmaDeposito}
              firmaAgencia={firmaAgencia}
              onFirmaDeposito={setFirmaDeposito}
              onFirmaAgencia={setFirmaAgencia}
            />

            <button
              type="button"
              onClick={handleCompletarActa}
              disabled={isCompletarBusy}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-[var(--radius-btn)] font-['Syne'] font-semibold text-[var(--navy)] text-sm transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #00D4FF, #0096b3)',
                boxShadow: '0 0 24px rgba(0,212,255,0.4)',
              }}
            >
              {isCompletarBusy ? 'Guardando...' : 'Completar Acta'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
