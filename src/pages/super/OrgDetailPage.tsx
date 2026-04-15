import { useState, FormEvent, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2, Calendar, Hash, Copy, Check, Pencil } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { Organization } from '@/types'
import { Button, LoadingSpinner, ErrorMessage, useToast } from '@/components/ui'

function useOrgDetail(id: string) {
  return useQuery({
    queryKey: [...QK.orgs(), id],
    queryFn: () => api.get<Organization>(`/organizations/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch {
      // fallback silencioso
    }
  }

  return { copied, copy }
}

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: org, isLoading, error, refetch } = useOrgDetail(id ?? '')

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [nameError, setNameError] = useState('')

  const { copied: idCopied, copy: copyId } = useCopyToClipboard()

  useEffect(() => {
    if (org) setNameValue(org.name)
  }, [org])

  const updateMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      api.patch<Organization>(`/organizations/${id}`, payload).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QK.orgs() })
      queryClient.setQueryData([...QK.orgs(), id], updated)
      toast.success('Nombre actualizado correctamente')
      setEditingName(false)
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Error al actualizar la organización'
      toast.error(message)
    },
  })

  function validateName(value: string): string {
    if (!value.trim()) return 'El nombre es requerido'
    if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
    return ''
  }

  function handleEditCancel() {
    setEditingName(false)
    setNameValue(org?.name ?? '')
    setNameError('')
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const error = validateName(nameValue)
    if (error) {
      setNameError(error)
      return
    }
    if (nameValue.trim() === org?.name) {
      setEditingName(false)
      return
    }
    updateMutation.mutate({ name: nameValue.trim() })
  }

  const formattedDate = org
    ? new Date(org.created_at).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  if (isLoading) {
    return <LoadingSpinner label="Cargando organización..." />
  }

  if (error || !org) {
    return (
      <ErrorMessage
        title="Organización no encontrada"
        message="No se pudo cargar la información de esta organización."
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/super')}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-white/5 transition-colors"
          aria-label="Volver a organizaciones"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-['Syne'] font-bold text-2xl text-[var(--off-white)] truncate">
            {org.name}
          </h1>
          <p className="text-sm text-[var(--muted)] font-['DM_Sans'] mt-0.5">
            Detalle de organización
          </p>
        </div>
      </div>

      {/* Card de información */}
      <div className="glass-card rounded-2xl p-6 flex flex-col gap-6">
        {/* Ícono + nombre */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--signal)]/10 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7 text-[var(--signal)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--muted)] font-['DM_Sans'] uppercase tracking-wider mb-1">
              Organización
            </p>
            <p className="font-['Syne'] font-semibold text-xl text-[var(--off-white)] truncate">
              {org.name}
            </p>
          </div>
        </div>

        <div className="border-t border-white/5" />

        {/* Campos de solo lectura */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ID copiable */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">
              <Hash className="w-3.5 h-3.5" />
              ID
            </label>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
              <span className="font-mono text-xs text-[var(--off-white)] flex-1 select-all truncate">
                {org.id}
              </span>
              <button
                onClick={() => copyId(org.id)}
                className="shrink-0 text-[var(--muted)] hover:text-[var(--signal)] transition-colors"
                aria-label={idCopied ? 'ID copiado' : 'Copiar ID'}
                title={idCopied ? 'Copiado' : 'Copiar ID'}
              >
                {idCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Fecha de creación */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">
              <Calendar className="w-3.5 h-3.5" />
              Creada
            </label>
            <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
              <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5" />

        {/* Sección editar nombre */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans']">
              Nombre de la organización
            </label>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--signal)] transition-colors font-['DM_Sans']"
                aria-label="Editar nombre de la organización"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            )}
          </div>

          {editingName ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => {
                    setNameValue(e.target.value)
                    if (nameError) setNameError(validateName(e.target.value))
                  }}
                  onBlur={() => setNameError(validateName(nameValue))}
                  placeholder="Nombre de la organización"
                  maxLength={120}
                  disabled={updateMutation.isPending}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'edit-name-error' : undefined}
                  autoFocus
                  className="w-full bg-white/5 border border-[var(--signal)]/50 rounded-xl px-4 py-3 text-[var(--off-white)] placeholder-[var(--muted)] font-['DM_Sans'] text-sm focus:outline-none focus:border-[var(--signal)] focus:ring-1 focus:ring-[var(--signal)] transition-colors disabled:opacity-50 aria-[invalid=true]:border-red-500/50"
                />
                {nameError && (
                  <p
                    id="edit-name-error"
                    role="alert"
                    className="text-xs text-red-400 font-['DM_Sans']"
                  >
                    {nameError}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleEditCancel}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
                {org.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
