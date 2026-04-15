import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2 } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { Organization } from '@/types'
import { Button, useToast } from '@/components/ui'

interface CreateOrgPayload {
  name: string
}

export default function CreateOrgPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  const createMutation = useMutation({
    mutationFn: (payload: CreateOrgPayload) =>
      api.post<Organization>('/organizations', payload).then((r) => r.data),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: QK.orgs() })
      toast.success(`Organización "${org.name}" creada correctamente`)
      navigate(`/super/organizaciones/${org.id}`)
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Error al crear la organización'
      toast.error(message)
    },
  })

  function validateName(value: string): string {
    if (!value.trim()) return 'El nombre es requerido'
    if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
    return ''
  }

  function handleNameChange(value: string) {
    setName(value)
    if (nameError) setNameError(validateName(value))
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const error = validateName(name)
    if (error) {
      setNameError(error)
      return
    }
    createMutation.mutate({ name: name.trim() })
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/super')}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-white/5 transition-colors"
          aria-label="Volver a organizaciones"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-['Syne'] font-bold text-2xl text-[var(--off-white)]">
            Nueva organización
          </h1>
          <p className="text-sm text-[var(--muted)] font-['DM_Sans'] mt-0.5">
            Crea una nueva organización en SEÑAL
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="glass-card rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Ícono ilustrativo */}
          <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-[var(--signal)]/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-[var(--signal)]" />
            </div>
            <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
              La organización agrupará usuarios, formularios, ubicaciones y toda la
              configuración del tenant.
            </p>
          </div>

          {/* Campo nombre */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="org-name"
              className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans']"
            >
              Nombre de la organización
              <span className="text-red-400 ml-1" aria-hidden="true">*</span>
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setNameError(validateName(name))}
              placeholder="Ej. Constructora Andina S.A.S"
              maxLength={120}
              disabled={createMutation.isPending}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'org-name-error' : undefined}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-[var(--off-white)] placeholder-[var(--muted)] font-dm text-sm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed aria-[invalid=true]:border-red-500/50"
            />
            {nameError && (
              <p
                id="org-name-error"
                role="alert"
                className="text-xs text-red-400 font-['DM_Sans']"
              >
                {nameError}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear organización'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => navigate('/super')}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
