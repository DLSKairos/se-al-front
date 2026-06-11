import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MessageCircle, RotateCcw, Check, Eye, Send, Clock, Search, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Modal, useToast } from '@/components/ui'
import { signaturesApi } from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import type { SignatureStatusEntry, ExternalSigner, SignatureLinkStatus } from '@/types'

// ── Sub-componentes ────────────────────────────────────────────────────────

function LinkStatusChip({ status }: { status: SignatureLinkStatus | null }) {
  if (status === 'SIGNED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[var(--radius-badge)] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-['DM_Sans']">
        <Check className="w-3 h-3" />
        Firmado
      </span>
    )
  }
  if (status === 'VIEWED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[var(--radius-badge)] bg-[var(--signal-dim)] text-[var(--signal)] border border-[var(--signal)]/25 font-['DM_Sans']">
        <Eye className="w-3 h-3" />
        Visto
      </span>
    )
  }
  if (status === 'SENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[var(--radius-badge)] bg-amber-500/15 text-amber-400 border border-amber-500/25 font-['DM_Sans']">
        <Send className="w-3 h-3" />
        Link enviado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[var(--radius-badge)] bg-white/5 text-[var(--muted)] border border-white/10 font-['DM_Sans']">
      <Clock className="w-3 h-3" />
      Pendiente
    </span>
  )
}

function SignerRow({
  entry,
  submissionId,
  workLocationId,
  mobileView,
}: {
  entry: SignatureStatusEntry
  submissionId: string
  workLocationId: string | null
  mobileView: boolean
}) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const markSentMutation = useMutation({
    mutationFn: (tokenId: string) => signaturesApi.markLinkSent(tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.signatures.status(submissionId) })
    },
    onError: () => toast.error('Error al registrar el envío del link'),
  })

  // Construye el link de WhatsApp
  const handleWhatsApp = (signer: ExternalSigner, token: SignatureStatusEntry) => {
    const phone = signer.phone.replace(/\D/g, '')
    const baseUrl = window.location.origin
    // Buscamos el token_id desde el entry si está disponible
    // El link apunta a /firma/:token — no disponemos del token string desde SignatureStatusEntry
    // El token string solo está disponible en SignatureTokenInfo (post-crear token)
    // Para este panel usamos una URL base con el submission + signer como fallback
    const message = encodeURIComponent(
      `Hola ${signer.name}, te comparto el link para firmar el documento en SEÑAL. ` +
      `Por favor firma desde: ${baseUrl}/firma/[TOKEN]`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const isSigned = entry.link_status === 'SIGNED'

  if (mobileView) {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-[var(--radius-glass-md)] bg-white/5 border border-white/8">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-[var(--off-white)] font-['Syne']">
              {entry.display_name}
            </p>
            <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5">
              {entry.signer_type === 'INTERNAL' ? 'Operario SEÑAL' : 'Firmante externo'}
            </p>
            {entry.signed_at && (
              <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5">
                Firmado el {new Date(entry.signed_at).toLocaleString('es-CO')}
              </p>
            )}
          </div>
          <LinkStatusChip status={entry.link_status} />
        </div>

        {entry.signer_type === 'EXTERNAL' && entry.external_signer && !isSigned && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full min-h-[48px] border-green-500/30 text-green-400 hover:border-green-400/60"
            onClick={() => handleWhatsApp(entry.external_signer!, entry)}
          >
            <MessageCircle className="w-5 h-5" />
            Enviar por WhatsApp
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[var(--signal-dim)] flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-[var(--signal)] font-['Syne']">
            {entry.display_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans'] truncate">
            {entry.display_name}
          </p>
          <p className="text-xs text-[var(--muted)] font-['DM_Sans']">
            {entry.signer_type === 'INTERNAL' ? 'Operario SEÑAL' : 'Externo'}
            {entry.signed_at && ` · ${new Date(entry.signed_at).toLocaleDateString('es-CO')}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <LinkStatusChip status={entry.link_status} />
        {entry.signer_type === 'EXTERNAL' && entry.external_signer && !isSigned && (
          <button
            className="w-8 h-8 rounded-[var(--radius-btn)] bg-green-500/15 flex items-center justify-center text-green-400 hover:bg-green-500/25 transition-colors"
            onClick={() => handleWhatsApp(entry.external_signer!, entry)}
            title="Enviar link por WhatsApp"
            aria-label={`Enviar link a ${entry.display_name} por WhatsApp`}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal: Agregar firmante ────────────────────────────────────────────────

interface AddSignerModalProps {
  open: boolean
  onClose: () => void
  submissionId: string
  workLocationId: string
  onSignerAdded: (token: import('@/types').SignatureTokenInfo) => void
}

function AddSignerModal({
  open,
  onClose,
  submissionId,
  workLocationId,
  onSignerAdded,
}: AddSignerModalProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'catalog' | 'new'>('catalog')
  const [form, setForm] = useState({ name: '', identification_number: '', phone: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedSignerId, setSelectedSignerId] = useState<string | null>(null)

  const { data: signers = [], isLoading: loadingSigners } = useQuery({
    queryKey: QK.signatures.externalSigners(workLocationId),
    queryFn: () => signaturesApi.listExternalSigners(workLocationId).then((r) => r.data),
    enabled: open && !!workLocationId,
  })

  const createSignerMutation = useMutation({
    mutationFn: (dto: { name: string; identification_number: string; phone: string }) =>
      signaturesApi.createExternalSigner({
        ...dto,
        work_location_id: workLocationId,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QK.signatures.externalSigners(workLocationId) })
      setSelectedSignerId(res.data.id)
      setMode('catalog')
    },
    onError: () => toast.error('Error al crear el firmante'),
  })

  const createTokenMutation = useMutation({
    mutationFn: (externalSignerId: string) =>
      signaturesApi.createSignatureToken({
        submission_id: submissionId,
        external_signer_id: externalSignerId,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QK.signatures.status(submissionId) })
      onSignerAdded(res.data)
      handleClose()
      toast.success('Firmante agregado. Ahora puedes enviar el link por WhatsApp.')
    },
    onError: () => toast.error('Error al generar el link de firma'),
  })

  const handleClose = () => {
    setSearch('')
    setMode('catalog')
    setForm({ name: '', identification_number: '', phone: '' })
    setFormErrors({})
    setSelectedSignerId(null)
    onClose()
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'El nombre es requerido'
    if (!/^\d{5,20}$/.test(form.identification_number))
      errors.identification_number = 'Cédula inválida (solo números, 5-20 dígitos)'
    if (!/^\+?[0-9]{7,15}$/.test(form.phone))
      errors.phone = 'Celular inválido. Ejemplo: +573001234567'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateNew = () => {
    if (!validateForm()) return
    createSignerMutation.mutate(form)
  }

  const handleSelectAndAdd = (signerId: string) => {
    createTokenMutation.mutate(signerId)
  }

  const filtered = signers.filter(
    (s: ExternalSigner) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.identification_number.includes(search),
  )

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}
      title="Agregar firmante"
      description="Elige del catálogo de la obra o crea uno nuevo."
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex rounded-[var(--radius-btn)] overflow-hidden border border-white/10">
          <button
            className={`flex-1 py-2 text-sm font-['DM_Sans'] transition-colors ${
              mode === 'catalog'
                ? 'bg-[var(--signal-dim)] text-[var(--signal)]'
                : 'text-[var(--muted)] hover:text-[var(--off-white)]'
            }`}
            onClick={() => setMode('catalog')}
            aria-pressed={mode === 'catalog'}
          >
            Del catálogo
          </button>
          <button
            className={`flex-1 py-2 text-sm font-['DM_Sans'] transition-colors ${
              mode === 'new'
                ? 'bg-[var(--signal-dim)] text-[var(--signal)]'
                : 'text-[var(--muted)] hover:text-[var(--off-white)]'
            }`}
            onClick={() => setMode('new')}
            aria-pressed={mode === 'new'}
          >
            Nuevo firmante
          </button>
        </div>

        {mode === 'catalog' && (
          <div className="flex flex-col gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] pl-10 pr-4 py-2.5 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] placeholder:text-[var(--muted)]"
              />
            </div>

            {/* Lista */}
            <div className="max-h-52 overflow-y-auto flex flex-col gap-1.5">
              {loadingSigners && (
                <p className="text-xs text-[var(--muted)] font-['DM_Sans'] text-center py-4">
                  Cargando firmantes...
                </p>
              )}
              {!loadingSigners && filtered.length === 0 && (
                <p className="text-xs text-[var(--muted)] font-['DM_Sans'] text-center py-4">
                  No hay firmantes en el catálogo.{' '}
                  <button
                    className="text-[var(--signal)] hover:underline"
                    onClick={() => setMode('new')}
                  >
                    Crea uno nuevo
                  </button>
                </p>
              )}
              {filtered.map((s: ExternalSigner) => (
                <button
                  key={s.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-[var(--radius-btn)] text-left transition-colors ${
                    selectedSignerId === s.id
                      ? 'bg-[var(--signal-dim)] border border-[var(--signal)]/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => setSelectedSignerId(s.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--signal-dim)] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--signal)]">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--off-white)] font-['DM_Sans'] truncate">{s.name}</p>
                    <p className="text-xs text-[var(--muted)]">CC: {s.identification_number} · {s.phone}</p>
                  </div>
                  {selectedSignerId === s.id && (
                    <Check className="w-4 h-4 text-[var(--signal)] shrink-0 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full min-h-[48px]"
              disabled={!selectedSignerId}
              loading={createTokenMutation.isPending}
              onClick={() => selectedSignerId && handleSelectAndAdd(selectedSignerId)}
            >
              Agregar firmante
            </Button>
          </div>
        )}

        {mode === 'new' && (
          <div className="flex flex-col gap-3">
            {[
              { key: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Ej: Carlos Rodríguez' },
              { key: 'identification_number', label: 'Número de cédula', type: 'tel', placeholder: 'Ej: 1234567890' },
              { key: 'phone', label: 'Celular (+57)', type: 'tel', placeholder: 'Ej: +573001234567' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label
                  htmlFor={`new-signer-${key}`}
                  className="block text-xs text-[var(--muted)] font-['DM_Sans'] mb-1"
                >
                  {label}
                </label>
                <input
                  id={`new-signer-${key}`}
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-2.5 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] placeholder:text-[var(--muted)]"
                />
                {formErrors[key] && (
                  <p className="text-xs text-red-400 mt-1">{formErrors[key]}</p>
                )}
              </div>
            ))}

            <Button
              variant="primary"
              size="lg"
              className="w-full min-h-[48px] mt-1"
              loading={createSignerMutation.isPending}
              onClick={handleCreateNew}
            >
              <UserPlus className="w-4 h-4" />
              Crear y agregar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Modal: Enviar link con token ──────────────────────────────────────────

interface SendLinkModalProps {
  open: boolean
  onClose: () => void
  token: import('@/types').SignatureTokenInfo
  submissionId: string
}

function SendLinkModal({ open, onClose, token, submissionId }: SendLinkModalProps) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const markSentMutation = useMutation({
    mutationFn: () => signaturesApi.markLinkSent(token.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.signatures.status(submissionId) })
      onClose()
    },
    onError: () => toast.error('Error al registrar el envío'),
  })

  const handleSendWhatsApp = () => {
    const signer = token.external_signer
    if (!signer) return

    const phone = signer.phone.replace(/\D/g, '')
    const link = `${window.location.origin}/firma/${token.token}`
    const message = encodeURIComponent(
      `Hola ${signer.name}, te envío el link para firmar el documento en SEÑAL:\n${link}\n\nEl link vence en 2 horas.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    markSentMutation.mutate()
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose() }}
      title="Enviar link de firma"
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div className="p-3 rounded-[var(--radius-input)] bg-white/5 border border-white/8">
          <p className="text-xs text-[var(--muted)] font-['DM_Sans']">Destinatario</p>
          <p className="text-sm text-[var(--off-white)] font-semibold font-['DM_Sans']">
            {token.external_signer?.name ?? '—'}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {token.external_signer?.phone ?? '—'}
          </p>
        </div>

        <div className="p-3 rounded-[var(--radius-input)] bg-amber-500/8 border border-amber-500/20">
          <p className="text-xs text-amber-400 font-['DM_Sans']">
            El link vence en 2 horas. Al tocar el botón se abrira WhatsApp con el mensaje listo.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full min-h-[52px] bg-green-600 hover:bg-green-500"
          style={{ background: '#16a34a', boxShadow: 'none' }}
          onClick={handleSendWhatsApp}
          loading={markSentMutation.isPending}
        >
          <MessageCircle className="w-5 h-5" />
          Abrir WhatsApp
        </Button>
      </div>
    </Modal>
  )
}

// ── Componente principal: SignersPanel ────────────────────────────────────

interface SignersPanelProps {
  submissionId: string
  workLocationId: string | null
  /** true = vista móvil grande (para OperatorLayout), false = vista densa (admin) */
  mobileView?: boolean
}

/**
 * Panel reutilizable de gestión de firmantes.
 * Usado en SubmissionDetailPage (admin) y SignersViewPage (operario).
 */
export default function SignersPanel({
  submissionId,
  workLocationId,
  mobileView = false,
}: SignersPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [pendingToken, setPendingToken] = useState<import('@/types').SignatureTokenInfo | null>(null)

  const {
    data: signerEntries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QK.signatures.status(submissionId),
    queryFn: () =>
      signaturesApi.getSubmissionStatus(submissionId).then((r) => r.data),
    enabled: !!submissionId,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-[var(--radius-glass-md)] bg-white/5 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-[var(--radius-glass-md)] bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-red-400 font-['DM_Sans']">
          Error al cargar los firmantes.{' '}
          <button className="underline hover:no-underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Lista de firmantes */}
      {signerEntries.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--muted)] font-['DM_Sans']">
            No hay firmantes registrados para este documento.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {signerEntries.map((entry: SignatureStatusEntry, i: number) => (
            <motion.div
              key={`${entry.signer_type}-${entry.internal_user_id ?? entry.external_signer_id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SignerRow
                entry={entry}
                submissionId={submissionId}
                workLocationId={workLocationId}
                mobileView={mobileView}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Botón agregar firmante */}
      {workLocationId && (
        <Button
          variant="secondary"
          size={mobileView ? 'lg' : 'md'}
          className={`${mobileView ? 'w-full min-h-[52px]' : ''}`}
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          Agregar firmante
        </Button>
      )}

      {/* Modal agregar */}
      <AddSignerModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        submissionId={submissionId}
        workLocationId={workLocationId ?? ''}
        onSignerAdded={(token) => {
          setPendingToken(token)
        }}
      />

      {/* Modal enviar link */}
      {pendingToken && (
        <SendLinkModal
          open={!!pendingToken}
          onClose={() => setPendingToken(null)}
          token={pendingToken}
          submissionId={submissionId}
        />
      )}
    </div>
  )
}
