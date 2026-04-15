import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { Organization } from '@/types'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function OrgSettingsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const { data: org, isLoading, error } = useQuery({
    queryKey: QK.orgs(),
    queryFn: () =>
      api.get<Organization>('/organizations/me').then((r) => r.data),
  })

  useEffect(() => {
    if (org) setName(org.name)
  }, [org])

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      api.patch('/organizations/me', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.orgs() })
      toast.success('Organización actualizada correctamente')
    },
    onError: () => toast.error('Error al actualizar la organización'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    updateMutation.mutate({ name: name.trim() })
  }

  if (isLoading) return <LoadingSpinner label="Cargando configuración..." />
  if (error || !org) return <ErrorMessage message="Error al cargar la organización" />

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
          Configuración de la organización
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
          Ajusta los datos generales de tu organización
        </p>
      </div>

      {/* Info de solo lectura */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--signal-dim)] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[var(--signal)]" />
          </div>
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            Información general
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted)] font-['DM_Sans'] uppercase tracking-wider">
              ID de la organización
            </span>
            <span className="text-sm text-[var(--off-white)] font-mono bg-white/5 px-3 py-1.5 rounded-lg select-all">
              {org.id}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted)] font-['DM_Sans'] uppercase tracking-wider">
              Fecha de creación
            </span>
            <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
              {formatDate(org.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario editable */}
      <div className="glass-card p-5">
        <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base mb-4">
          Datos editables
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="org-name"
              className="text-sm text-[var(--muted)] font-['DM_Sans']"
            >
              Nombre de la organización <span className="text-red-400">*</span>
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de tu empresa"
              required
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              loading={updateMutation.isPending}
              disabled={name.trim() === org.name}
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
