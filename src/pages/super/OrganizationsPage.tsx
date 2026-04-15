import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, Calendar, Hash } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { Organization } from '@/types'
import { Button, LoadingSpinner, ErrorMessage } from '@/components/ui'

export default function OrganizationsPage() {
  const navigate = useNavigate()

  const { data: orgs = [], isLoading, error, refetch } = useQuery({
    queryKey: QK.orgs(),
    queryFn: () => api.get<Organization[]>('/organizations').then((r) => r.data),
  })

  if (isLoading) {
    return <LoadingSpinner label="Cargando organizaciones..." />
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error al cargar organizaciones"
        message="No se pudieron obtener las organizaciones. Verifica tu conexión e intenta de nuevo."
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Syne'] font-bold text-2xl text-[var(--off-white)]">
            Organizaciones
          </h1>
          <p className="text-sm text-[var(--muted)] font-['DM_Sans'] mt-1">
            {orgs.length} {orgs.length === 1 ? 'organización registrada' : 'organizaciones registradas'}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/super/organizaciones/nueva')}
        >
          <Plus className="w-4 h-4" />
          Nueva organización
        </Button>
      </div>

      {/* Lista vacía */}
      {orgs.length === 0 && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--signal)]/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[var(--signal)]" />
          </div>
          <div>
            <p className="font-['Syne'] font-semibold text-[var(--off-white)] text-lg">
              No hay organizaciones
            </p>
            <p className="text-sm text-[var(--muted)] font-['DM_Sans'] mt-1">
              Crea la primera organización para comenzar
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/super/organizaciones/nueva')}
          >
            <Plus className="w-4 h-4" />
            Crear organización
          </Button>
        </div>
      )}

      {/* Tabla */}
      {orgs.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    Nombre
                  </span>
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">
                  <span className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" />
                    ID
                  </span>
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider font-['DM_Sans']">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Creada
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orgs.map((org) => (
                <OrgRow
                  key={org.id}
                  org={org}
                  onClick={() => navigate(`/super/organizaciones/${org.id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrgRow({ org, onClick }: { org: Organization; onClick: () => void }) {
  const formattedDate = new Date(org.created_at).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer hover:bg-[rgba(22,34,56,0.3)] transition-colors"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--signal)]/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-[var(--signal)]" />
          </div>
          <span className="font-['DM_Sans'] font-medium text-[var(--off-white)] group-hover:text-[var(--signal)] transition-colors">
            {org.name}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className="font-mono text-xs text-[var(--muted)] bg-white/5 px-2 py-1 rounded select-all cursor-text"
          onClick={(e) => e.stopPropagation()}
          title="Haz clic para seleccionar"
        >
          {org.id}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-[var(--muted)] font-['DM_Sans']">{formattedDate}</span>
      </td>
    </tr>
  )
}
