import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Fingerprint, Trash2, Plus, Shield, Building2, LogOut } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { WebAuthnCredential } from '@/types'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  ConfirmModal,
  useToast,
} from '@/components/ui'
import { InstallPWAButton } from '@/components/ui/InstallPWAButton'
import { SOSButton } from '@/components/ui/SOSButton'
import { registerWebAuthn, checkWebAuthnSupport } from '@/lib/webauthn'
import { formatDateTime } from '@/lib/utils'

// ── Componente ────────────────────────────────────────────────────────────────

export default function OperatorProfilePage() {
  const navigate    = useNavigate()
  const toast       = useToast()
  const queryClient = useQueryClient()
  const { user }    = useAuthStore()

  const userId = user?.sub ?? ''

  const [registeringPasskey, setRegisteringPasskey] = useState(false)
  const [credToDelete, setCredToDelete]             = useState<string | null>(null)

  // ── Query: credenciales WebAuthn ──────────────────────────────────────────
  const {
    data: credentials = [],
    isLoading: loadingCreds,
    error: credsError,
  } = useQuery({
    queryKey: ['webauthn-credentials', userId],
    queryFn: () =>
      api
        .get<WebAuthnCredential[]>(`/users/${userId}/webauthn/credentials`)
        .then((r) => r.data),
    enabled: !!userId,
  })

  // ── Mutación: eliminar credencial ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (credentialId: string) =>
      api.delete(`/users/${userId}/webauthn/credentials/${credentialId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webauthn-credentials', userId] })
      setCredToDelete(null)
      toast.success('Credencial eliminada')
    },
    onError: () => toast.error('No se pudo eliminar la credencial.'),
  })

  // ── Registrar nueva passkey ───────────────────────────────────────────────
  const handleRegisterPasskey = async () => {
    const supported = await checkWebAuthnSupport()
    if (!supported) {
      toast.warning('Tu dispositivo no soporta biometria / passkeys.')
      return
    }

    setRegisteringPasskey(true)
    try {
      await registerWebAuthn(userId)
      queryClient.invalidateQueries({ queryKey: ['webauthn-credentials', userId] })
      toast.success('Biometria registrada correctamente')
    } catch {
      toast.error('No se pudo registrar la biometria. Intenta de nuevo.')
    } finally {
      setRegisteringPasskey(false)
    }
  }

  // Inicial del nombre para el avatar
  const displayName = user?.jobTitle ?? 'Operario'
  const initial = displayName.charAt(0).toUpperCase()

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-[var(--navy)] flex flex-col pb-24"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-white/5 hover:bg-white/10 transition-colors text-[var(--muted)] hover:text-[var(--off-white)]"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)]">
            Cuenta
          </p>
          <h1 className="font-display font-extrabold text-base text-[var(--off-white)]">
            Mi perfil
          </h1>
        </div>
        <div>
          <InstallPWAButton />
        </div>
      </div>

      {/* Avatar section */}
      <div className="flex flex-col items-center py-8 px-6">
        <div className="w-16 h-16 rounded-full bg-[rgba(0,212,255,0.1)] border-2 border-[var(--signal)] flex items-center justify-center font-display font-bold text-2xl text-[var(--signal)]">
          {initial}
        </div>
        <p className="font-display font-bold text-lg text-[var(--off-white)] mt-3">
          {displayName}
        </p>
        <p className="text-sm text-[var(--muted)] font-dm">
          {user?.role === 'OPERATOR' ? 'Operario' : user?.role}
        </p>
      </div>

      <div className="flex flex-col gap-2 px-6">
        {/* ── Datos del usuario ─────────────────────────────────────────── */}
        <section aria-label="Informacion personal" className="mb-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)] mb-3">
            Información
          </p>
          <div className="flex flex-col gap-2">
            <div className="glass p-4 flex items-center gap-3 rounded-[14px]">
              <Shield className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)]">
                  ID de usuario
                </p>
                <p className="text-sm text-[var(--off-white)] font-dm truncate">
                  {user?.sub ?? '—'}
                </p>
              </div>
            </div>
            <div className="glass p-4 flex items-center gap-3 rounded-[14px]">
              <Building2 className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--muted)]">
                  Organización
                </p>
                <p className="text-sm text-[var(--off-white)] font-dm truncate">
                  {user?.orgId ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Biometria / Passkeys ──────────────────────────────────────── */}
        <section aria-label="Biometria y passkeys">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-[var(--signal)]" aria-hidden="true" />
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--signal)]">
                Biometria / Passkeys
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              loading={registeringPasskey}
              onClick={handleRegisterPasskey}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Agregar
            </Button>
          </div>

          {loadingCreds && <LoadingSpinner size="sm" label="Cargando credenciales..." />}

          {!loadingCreds && credsError && (
            <ErrorMessage message="No se pudieron cargar las credenciales." />
          )}

          {!loadingCreds && !credsError && credentials.length === 0 && (
            <div className="glass rounded-[14px] p-6 text-center">
              <Fingerprint className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-[var(--muted)] font-dm">
                No tienes biometria registrada.
              </p>
              <p className="text-xs text-[var(--muted)] font-dm mt-1">
                Agrega tu huella o Face ID para ingresar mas rapido.
              </p>
            </div>
          )}

          {!loadingCreds && !credsError && credentials.length > 0 && (
            <div className="flex flex-col gap-2">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="glass p-4 flex items-center gap-3 rounded-[14px]"
                >
                  <Fingerprint className="w-4 h-4 text-[var(--signal)] shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--off-white)] font-dm font-medium truncate">
                      Dispositivo biometrico
                    </p>
                    <p className="text-xs text-[var(--muted)] font-dm mt-0.5">
                      Registrado {formatDateTime(cred.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCredToDelete(cred.id)}
                    className="text-[var(--muted)] hover:text-red-400 transition-colors p-1"
                    aria-label="Eliminar credencial biometrica"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Botón de logout */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full mt-6 py-4 rounded-[14px] border border-[rgba(239,68,68,0.2)] text-red-400 font-display text-[13px] font-bold tracking-[0.1em] uppercase active:scale-[0.97] transition-all flex items-center justify-center gap-2 bg-transparent"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>

      {/* Modal confirmar eliminar */}
      <ConfirmModal
        open={!!credToDelete}
        onOpenChange={(open) => { if (!open) setCredToDelete(null) }}
        title="Eliminar credencial"
        description="Esta accion eliminara la biometria de este dispositivo. Podras registrarla de nuevo cuando quieras."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => credToDelete && deleteMutation.mutate(credToDelete)}
      />

      <SOSButton />
    </div>
  )
}
