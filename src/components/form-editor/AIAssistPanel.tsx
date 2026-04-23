import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Send, Loader2, AlertTriangle } from 'lucide-react'
import { formAiApi } from '@/lib/api'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { EditorField } from '@/types'

// ── Tipos locales ──────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'ai' | 'error'

interface Message {
  id: string
  role: MessageRole
  content: string
}

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'ai',
  content:
    'Hola! Soy SEÑALIA. Puedo ayudarte a reorganizar secciones, agregar campos o sugerir mejoras a tu formulario. ¿En qué te ayudo?',
}

// ── Bubble ─────────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3 py-2 rounded-xl rounded-tr-sm text-sm bg-[rgba(0,212,255,0.1)] text-[var(--off-white)] font-['DM_Sans']">
          {message.content}
        </div>
      </div>
    )
  }

  if (message.role === 'error') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] px-3 py-2 rounded-xl rounded-tl-sm text-sm bg-[var(--navy-light)] border border-[var(--amber)]/30 text-[var(--amber)] font-['DM_Sans'] flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{message.content}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] px-3 py-2 rounded-xl rounded-tl-sm text-sm bg-[var(--navy-light)] text-[var(--off-white)] font-['DM_Sans']">
        {message.content}
      </div>
    </div>
  )
}

// ── AIAssistPanel ──────────────────────────────────────────────────────────────

interface AIAssistPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AIAssistPanel({ isOpen, onClose }: AIAssistPanelProps) {
  const { state, applySectionsFromAI, addField, setColumns } = useFormEditorStore()
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll al último mensaje
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await formAiApi.assist({
        message: trimmed,
        currentSections: state.sections,
      })

      const result = res.data

      // Aplicar acción según la respuesta
      if (result.action === 'update_sections' && result.payload?.sections) {
        applySectionsFromAI(result.payload.sections)
      } else if (result.action === 'add_field' && result.payload?.sectionId) {
        const fieldData = result.payload.field as Partial<EditorField> | undefined
        addField(result.payload.sectionId, fieldData ?? {})
      } else if (result.action === 'set_columns' && result.payload?.columns) {
        setColumns(result.payload.columns)
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'ai',
        content:
          result.message ??
          (result.action === 'none'
            ? 'Entendido, no se realizaron cambios.'
            : 'Listo, apliqué los cambios al formulario.'),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'error',
        content:
          'No pude procesar tu solicitud en este momento. Verifica tu conexión o intenta con otra instrucción.',
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="ai-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-80 shrink-0 flex flex-col bg-[var(--navy-mid)] border-l border-[rgba(0,212,255,0.15)] overflow-hidden"
          aria-label="Panel de asistente IA"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(0,212,255,0.12)]">
            <Sparkles size={16} className="text-[var(--signal)]" />
            <span className="text-sm font-semibold text-[var(--signal)] font-['Syne'] tracking-wide flex-1">
              SEÑALIA
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] transition-colors"
              aria-label="Cerrar panel de IA"
            >
              <X size={15} />
            </button>
          </div>

          {/* Lista de mensajes */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3"
          >
            {messages.map((msg) => (
              <Bubble key={msg.id} message={msg} />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-[var(--navy-light)] text-[var(--muted)] text-sm flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" />
                  Procesando...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[rgba(0,212,255,0.12)]">
            <div className="flex items-end gap-2 bg-[var(--navy)] rounded-xl border border-[rgba(0,212,255,0.15)] px-3 py-2 focus-within:border-[var(--signal)] transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe una instrucción..."
                rows={2}
                disabled={sending}
                className="flex-1 bg-transparent resize-none outline-none text-sm text-[var(--off-white)] placeholder:text-[var(--muted)] font-['DM_Sans'] disabled:opacity-50"
                aria-label="Instrucción para la IA"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-1.5 rounded-lg text-[var(--navy)] disabled:opacity-40 transition-all shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #00D4FF, #0096b3)',
                }}
                aria-label="Enviar instrucción"
              >
                <Send size={13} />
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-1.5 text-center font-['DM_Sans']">
              Enter para enviar · Shift+Enter nueva línea
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
