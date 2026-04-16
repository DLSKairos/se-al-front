import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Lock } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { FormContext, FormField } from '@/types'
import {
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'
import { DynamicForm } from '@/components/forms/DynamicForm'
import { GeoField } from '@/components/forms/fields/GeoField'
import { SOSButton } from '@/components/ui/SOSButton'

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface GeoCoords {
  lat: number
  lng: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildInitialValues(fields: FormField[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    if (field.type === 'GEOLOCATION') return acc
    if (field.default_value !== null) {
      acc[field.key] = field.default_value
    } else if (field.type === 'BOOLEAN') {
      acc[field.key] = undefined
    } else if (field.type === 'MULTISELECT') {
      acc[field.key] = []
    } else if (field.type === 'NUMBER') {
      acc[field.key] = ''
    } else {
      acc[field.key] = ''
    }
    return acc
  }, {})
}

function buildReadonlyValues(fields: FormField[], data: Record<string, unknown>): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    if (field.type === 'GEOLOCATION') return acc
    acc[field.key] = data[field.key] ?? ''
    return acc
  }, {})
}

function validateForm(fields: FormField[], values: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const field of fields) {
    if (!field.required || field.type === 'GEOLOCATION') continue
    const val = values[field.key]
    if (
      val === undefined ||
      val === null ||
      val === '' ||
      (Array.isArray(val) && val.length === 0)
    ) {
      errors.push(field.label)
    }
  }
  return errors
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function FillFormPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { workLocationId } = useAuthStore()

  const [values, setValues] = useState<Record<string, unknown>>({})
  const [geo, setGeo] = useState<GeoCoords | null>(null)
  const [geoError, setGeoError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Query: contexto del formulario ────────────────────────────────────────
  const {
    data: ctx,
    isLoading,
    error,
  } = useQuery({
    queryKey: QK.templates.context(templateId!),
    queryFn: () =>
      api
        .get<FormContext>(`/form-submissions/context/${templateId}`)
        .then((r) => r.data),
    enabled: !!templateId,
  })

  // ── Inicializar valores cuando llega el contexto ───────────────────────────
  useEffect(() => {
    if (!ctx) return
    if (ctx.is_readonly && ctx.last_submission) {
      setValues(buildReadonlyValues(ctx.template.fields, ctx.last_submission.data))
    } else {
      setValues(buildInitialValues(ctx.template.fields))
    }
  }, [ctx])

  // ── Captura GPS al montar ─────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setGeo({ lat: coords.latitude, lng: coords.longitude }),
      () => setGeoError(true),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  // ── Mutación: enviar formulario ───────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async (payload: {
      data: Record<string, unknown>
      signatureFields: FormField[]
    }) => {
      const submissionRes = await api.post<{ id: string }>('/form-submissions', {
        template_id: templateId,
        work_location_id: workLocationId,
        data: payload.data,
        geo_lat: geo?.lat ?? null,
        geo_lng: geo?.lng ?? null,
      })

      const submissionId = submissionRes.data.id

      // Firmas
      for (const sigField of payload.signatureFields) {
        const sigDataURL = payload.data[sigField.key] as string
        if (!sigDataURL) continue
        await api.post(`/form-submissions/${submissionId}/signatures`, {
          signer_name: sigField.label,
          signer_role: sigField.label,
          signature_url: sigDataURL,
        })
      }

      return submissionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.templates.context(templateId!) })
      toast.success('Formulario enviado correctamente')
      navigate('/')
    },
    onError: () => {
      toast.error('Ocurrio un error al enviar el formulario. Intenta de nuevo.')
    },
  })

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ctx) return

    const errors = validateForm(ctx.template.fields, values)
    if (errors.length > 0) {
      toast.warning(`Campos requeridos faltantes: ${errors.join(', ')}`)
      return
    }

    setIsSubmitting(true)
    const signatureFields = ctx.template.fields.filter((f) => f.type === 'SIGNATURE')

    // Serializar datos (excluir File objects — enviar solo metadatos o dataURL)
    const serializedData: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(values)) {
      if (val instanceof File) {
        // TODO: implementar upload de archivos a storage en siguiente iteracion
        serializedData[key] = null
      } else {
        serializedData[key] = val
      }
    }

    try {
      await submitMutation.mutateAsync({ data: serializedData, signatureFields })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Estados de carga ─────────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner fullscreen label="Cargando formulario..." />

  if (error || !ctx) {
    return (
      <div className="min-h-screen bg-[var(--navy)] flex items-center justify-center p-4">
        <ErrorMessage
          title="Error al cargar el formulario"
          message="No se pudo obtener el formulario. Verifica tu conexion e intenta de nuevo."
        />
      </div>
    )
  }

  const { template, is_readonly } = ctx
  const hasGeoField = template.fields.some((f) => f.type === 'GEOLOCATION')

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-[var(--navy)] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="px-5 pt-8 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-display text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--signal)]">
              Formulario
            </div>
            <div className="text-sm font-display font-semibold text-[var(--off-white)] truncate mt-0.5">
              {template.name}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {is_readonly && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30"
                title="Solo lectura"
              >
                <Lock className="w-3 h-3 text-amber-400" aria-hidden="true" />
                <span className="text-xs text-amber-400 font-dm">Solo lectura</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.05)] grid place-items-center"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--muted)]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-auto pb-28">
        {/* Geo display */}
        {hasGeoField && (
          <div className="px-5 pt-2 pb-4">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-2">
              Ubicación GPS
            </p>
            {geoError ? (
              <p className="text-xs text-amber-400 font-dm">
                No se pudo obtener el GPS. El formulario se enviará sin coordenadas.
              </p>
            ) : (
              <GeoField lat={geo?.lat ?? null} lng={geo?.lng ?? null} />
            )}
          </div>
        )}

        {/* Formulario */}
        <form
          id="dynamic-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 px-5 pt-2"
          noValidate
          aria-label={template.name}
        >
          {template.fields.length === 0 ? (
            <p className="text-[var(--muted)] text-sm font-dm text-center py-8">
              Este formulario no tiene campos configurados.
            </p>
          ) : (
            <DynamicForm
              fields={template.fields}
              values={values}
              onChange={handleChange}
              disabled={is_readonly}
            />
          )}
        </form>
      </div>

      {/* Footer con botón */}
      {!is_readonly && (
        <div
          className="fixed bottom-0 left-0 right-0 p-5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
        >
          <button
            type="submit"
            form="dynamic-form"
            disabled={isSubmitting}
            className="btn-primary-gradient w-full py-4 rounded-[14px] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
            {isSubmitting ? 'Enviando...' : 'Enviar formulario'}
          </button>
        </div>
      )}

      <SOSButton />
    </div>
  )
}
