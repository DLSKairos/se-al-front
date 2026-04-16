import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  Users,
  PencilLine,
  Power,
  KeyRound,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import {
  Button,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  ConfirmModal,
  Modal,
  useToast,
} from '@/components/ui'
import { User, UserRole, WorkLocation } from '@/types'

// ── Constantes ─────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
}

const ROLE_VARIANTS: Record<
  UserRole,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'draft'
> = {
  SUPER_ADMIN: 'danger',
  ADMIN: 'info',
  OPERATOR: 'draft',
}

const INPUT_CLASS =
  "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all placeholder:text-[var(--muted)]"

const SELECT_CLASS =
  "w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] transition-all"

// ── Tipos locales ───────────────────────────────────────────────────────────

interface UserFormData {
  name: string
  identification_number: string
  job_title: string
  role: 'OPERATOR' | 'ADMIN'
  work_location_id: string | undefined
  pin: string
}

const EMPTY_FORM: UserFormData = {
  name: '',
  identification_number: '',
  job_title: '',
  role: 'OPERATOR',
  work_location_id: '',
  pin: '',
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

interface LabelProps {
  htmlFor: string
  children: React.ReactNode
}

function FieldLabel({ htmlFor, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs text-[var(--muted)] font-['DM_Sans'] mb-1.5 uppercase tracking-wide"
    >
      {children}
    </label>
  )
}

// ── Página principal ────────────────────────────────────────────────────────

export default function UsersPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  // Estado de modales
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [toggleModalOpen, setToggleModalOpen] = useState(false)
  const [deletePinModalOpen, setDeletePinModalOpen] = useState(false)

  // Usuario seleccionado para acciones
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Modo del modal de usuario
  const [editMode, setEditMode] = useState(false)

  // Datos del formulario
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM)
  const [pinValue, setPinValue] = useState('')

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: QK.users(),
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  })

  const { data: workLocations = [] } = useQuery({
    queryKey: QK.workLocations(),
    queryFn: () =>
      api.get<WorkLocation[]>('/work-locations').then((r) => r.data),
  })

  // ── Mutations ──────────────────────────────────────────────────────────

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: QK.users() })

  const createMutation = useMutation({
    mutationFn: (data: Omit<UserFormData, 'pin'> & { pin?: string }) =>
      api.post('/users', data),
    onSuccess: () => {
      toast.success('Usuario creado correctamente')
      setUserModalOpen(false)
      invalidateUsers()
    },
    onError: () => toast.error('Error al crear el usuario'),
  })

  const editMutation = useMutation({
    mutationFn: (data: Partial<Omit<UserFormData, 'pin'>>) =>
      api.patch(`/users/${selectedUser?.id}`, data),
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente')
      setUserModalOpen(false)
      invalidateUsers()
    },
    onError: () => toast.error('Error al actualizar el usuario'),
  })

  const toggleMutation = useMutation({
    mutationFn: () =>
      api.patch(`/users/${selectedUser?.id}/toggle`),
    onSuccess: () => {
      const action = selectedUser?.is_active ? 'desactivado' : 'activado'
      toast.success(`Usuario ${action} correctamente`)
      setToggleModalOpen(false)
      invalidateUsers()
    },
    onError: () => toast.error('Error al cambiar el estado del usuario'),
  })

  const setPinMutation = useMutation({
    mutationFn: (pin: string) =>
      api.post(`/users/${selectedUser?.id}/pin/set`, { pin }),
    onSuccess: () => {
      toast.success('PIN establecido correctamente')
      setPinModalOpen(false)
      setPinValue('')
      invalidateUsers()
    },
    onError: () => toast.error('Error al establecer el PIN'),
  })

  const deletePinMutation = useMutation({
    mutationFn: () =>
      api.delete(`/users/${selectedUser?.id}/pin`),
    onSuccess: () => {
      toast.success('PIN eliminado correctamente')
      setDeletePinModalOpen(false)
      invalidateUsers()
    },
    onError: () => toast.error('Error al eliminar el PIN'),
  })

  // ── Handlers ──────────────────────────────────────────────────────────

  function openCreate() {
    setEditMode(false)
    setSelectedUser(null)
    setForm(EMPTY_FORM)
    setUserModalOpen(true)
  }

  function openEdit(user: User) {
    setEditMode(true)
    setSelectedUser(user)
    setForm({
      name: user.name,
      identification_number: user.identification_number,
      job_title: user.job_title,
      role: user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role,
      work_location_id: user.work_location_id ?? '',
      pin: '',
    })
    setUserModalOpen(true)
  }

  function openToggle(user: User) {
    setSelectedUser(user)
    setToggleModalOpen(true)
  }

  function openPinModal(user: User) {
    setSelectedUser(user)
    setPinValue('')
    setPinModalOpen(true)
  }

  function openDeletePin(user: User) {
    setSelectedUser(user)
    setDeletePinModalOpen(true)
  }

  function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editMode) {
      const { pin: _pin, ...rest } = form
      editMutation.mutate({
        ...rest,
        work_location_id: rest.work_location_id || undefined,
      } as Partial<Omit<UserFormData, 'pin'>>)
    } else {
      const payload: Omit<UserFormData, 'pin'> & { pin?: string } = {
        name: form.name,
        identification_number: form.identification_number,
        job_title: form.job_title,
        role: form.role,
        work_location_id: form.work_location_id || undefined,
      }
      if (form.pin) payload.pin = form.pin
      createMutation.mutate(payload)
    }
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pinValue.length < 4 || pinValue.length > 6) {
      toast.warning('El PIN debe tener entre 4 y 6 dígitos')
      return
    }
    setPinMutation.mutate(pinValue)
  }

  const isSaving = createMutation.isPending || editMutation.isPending

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
            Usuarios
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
            Gestiona los usuarios de tu organización
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <UserPlus className="w-4 h-4" />
          Crear usuario
        </Button>
      </div>

      {/* Tabla */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Cargando usuarios..." />
        ) : error ? (
          <ErrorMessage
            message="Error al cargar los usuarios"
            onRetry={() => refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-['DM_Sans']">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    'Nombre',
                    'Cédula',
                    'Cargo',
                    'Rol',
                    'Obra',
                    'Estado',
                    'PIN',
                    'Acciones',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left font-display font-semibold text-xs text-[var(--muted)] uppercase tracking-wider pb-3 pt-5 px-5 pr-4 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-10 h-10 text-[var(--muted)]" />
                        <p className="text-[var(--muted)] text-sm">
                          No hay usuarios registrados
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user, i) => (
                    <tr
                      key={user.id}
                      className={`border-b border-white/5 hover:bg-[rgba(22,34,56,0.3)] transition-colors ${
                        i % 2 === 1 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="py-3 px-5 pr-4 text-[var(--off-white)] font-medium">
                        {user.name}
                      </td>
                      <td className="py-3 pr-4 text-[var(--muted)]">
                        {user.identification_number}
                      </td>
                      <td className="py-3 pr-4 text-[var(--muted)]">
                        {user.job_title}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={ROLE_VARIANTS[user.role]}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-[var(--muted)]">
                        {user.work_location?.name ?? '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {user.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="draft">Inactivo</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {user.pin_enabled ? (
                          <Badge variant="info">Habilitado</Badge>
                        ) : (
                          <Badge variant="draft">Sin PIN</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-5">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(user)}
                            title="Editar usuario"
                            aria-label={`Editar ${user.name}`}
                          >
                            <PencilLine className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openToggle(user)}
                            title={user.is_active ? 'Desactivar' : 'Activar'}
                            aria-label={`${user.is_active ? 'Desactivar' : 'Activar'} ${user.name}`}
                          >
                            {user.is_active ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPinModal(user)}
                            title="Gestionar PIN"
                            aria-label={`Gestionar PIN de ${user.name}`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar usuario */}
      <Modal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        title={editMode ? 'Editar usuario' : 'Crear usuario'}
        description={
          editMode
            ? 'Modifica los datos del usuario'
            : 'Completa los datos para crear un nuevo usuario'
        }
        size="md"
      >
        <form onSubmit={handleUserSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="user-name">Nombre completo *</FieldLabel>
              <input
                id="user-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del usuario"
                className={INPUT_CLASS}
              />
            </div>

            {/* Cédula */}
            <div>
              <FieldLabel htmlFor="user-id">Cédula *</FieldLabel>
              <input
                id="user-id"
                type="text"
                required
                value={form.identification_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, identification_number: e.target.value }))
                }
                placeholder="Número de identificación"
                className={INPUT_CLASS}
              />
            </div>

            {/* Cargo */}
            <div>
              <FieldLabel htmlFor="user-job">Cargo *</FieldLabel>
              <input
                id="user-job"
                type="text"
                required
                value={form.job_title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, job_title: e.target.value }))
                }
                placeholder="Ej: Inspector SST"
                className={INPUT_CLASS}
              />
            </div>

            {/* Rol */}
            <div>
              <FieldLabel htmlFor="user-role">Rol *</FieldLabel>
              <select
                id="user-role"
                required
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as 'OPERATOR' | 'ADMIN',
                  }))
                }
                className={SELECT_CLASS}
              >
                <option value="OPERATOR">Operador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {/* Obra */}
            <div>
              <FieldLabel htmlFor="user-location">Obra</FieldLabel>
              <select
                id="user-location"
                value={form.work_location_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, work_location_id: e.target.value }))
                }
                className={SELECT_CLASS}
              >
                <option value="">Sin obra asignada</option>
                {workLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN (solo en creación) */}
            {!editMode && (
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="user-pin">
                  PIN (opcional, 4-6 dígitos)
                </FieldLabel>
                <input
                  id="user-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4,6}"
                  maxLength={6}
                  value={form.pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setForm((f) => ({ ...f, pin: val }))
                  }}
                  placeholder="Ingresa un PIN numérico"
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUserModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {editMode ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal gestión de PIN */}
      <Modal
        open={pinModalOpen}
        onOpenChange={(open) => {
          setPinModalOpen(open)
          if (!open) setPinValue('')
        }}
        title="Gestionar PIN"
        description={
          selectedUser?.pin_enabled
            ? `${selectedUser.name} ya tiene un PIN activo. Puedes cambiarlo o eliminarlo.`
            : `Establece un PIN de acceso para ${selectedUser?.name ?? 'el usuario'}.`
        }
        size="sm"
      >
        <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="new-pin">
              {selectedUser?.pin_enabled ? 'Nuevo PIN (4-6 dígitos)' : 'PIN (4-6 dígitos)'}
            </FieldLabel>
            <input
              id="new-pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              maxLength={6}
              required
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
              placeholder="Ingresa el PIN"
              className={INPUT_CLASS}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPinModalOpen(false)}
                disabled={setPinMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={setPinMutation.isPending}
              >
                <KeyRound className="w-4 h-4" />
                {selectedUser?.pin_enabled ? 'Cambiar PIN' : 'Establecer PIN'}
              </Button>
            </div>

            {selectedUser?.pin_enabled && (
              <div className="border-t border-white/5 pt-3 mt-1">
                <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mb-2">
                  Zona de peligro
                </p>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setPinModalOpen(false)
                    openDeletePin(selectedUser)
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar PIN
                </Button>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal confirmar toggle */}
      <ConfirmModal
        open={toggleModalOpen}
        onOpenChange={setToggleModalOpen}
        title={selectedUser?.is_active ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          selectedUser?.is_active
            ? `Al desactivar a ${selectedUser?.name}, no podrá acceder al sistema hasta que sea reactivado.`
            : `Al activar a ${selectedUser?.name}, podrá volver a acceder al sistema.`
        }
        confirmLabel={selectedUser?.is_active ? 'Desactivar' : 'Activar'}
        variant={selectedUser?.is_active ? 'danger' : 'warning'}
        loading={toggleMutation.isPending}
        onConfirm={() => toggleMutation.mutate()}
      />

      {/* Modal confirmar eliminar PIN */}
      <ConfirmModal
        open={deletePinModalOpen}
        onOpenChange={setDeletePinModalOpen}
        title="Eliminar PIN"
        description={`Se eliminará el PIN de ${selectedUser?.name}. El usuario ya no podrá autenticarse con PIN.`}
        confirmLabel="Eliminar PIN"
        variant="danger"
        loading={deletePinMutation.isPending}
        onConfirm={() => deletePinMutation.mutate()}
      />
    </div>
  )
}
