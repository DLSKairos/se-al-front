import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Send, Bot, User, Zap, Radio } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAuthStore } from '@/stores/authStore'
import { QK } from '@/lib/queryKeys'
import { DashboardStats } from '@/types'

// ── Preguntas rápidas predefinidas ─────────────────────────────────────────

const QUICK_QUERIES = [
  '¿Cuántos submissions pendientes hay?',
  '¿Cuántos usuarios activos tiene la organización?',
  'Dame un resumen del panel',
  '¿Cuántos submissions fueron rechazados?',
  '¿Cuál es la tasa de aprobación?',
]

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ── Lógica de respuesta (cliente, sin llamada al backend) ──────────────────

function generarRespuesta(pregunta: string, stats: DashboardStats | undefined): string {
  if (!stats) {
    return 'No tengo datos disponibles en este momento. Asegúrate de haber cargado el dashboard primero.'
  }

  const q = pregunta.toLowerCase()
  const {
    total_users:       totalUsers       = 0,
    active_users:      activeUsers      = 0,
    total_submissions: totalSubmissions = 0,
    by_status,
  } = stats

  const aprobados  = by_status?.APPROVED  ?? 0
  const pendientes = by_status?.SUBMITTED ?? 0
  const rechazados = by_status?.REJECTED  ?? 0

  const tasaAprobacion =
    totalSubmissions > 0
      ? ((aprobados / totalSubmissions) * 100).toFixed(1)
      : '0'

  if (q.includes('pendiente')) {
    return `Hay **${pendientes}** submissions en estado pendiente de un total de ${totalSubmissions} registrados.`
  }

  if (q.includes('usuario') && q.includes('activo')) {
    return `La organización tiene **${activeUsers}** usuarios activos de un total de ${totalUsers} usuarios registrados.`
  }

  if (q.includes('resumen') || q.includes('panel')) {
    return `### Resumen del Panel\n\n**Usuarios:** ${totalUsers} registrados, ${activeUsers} activos.\n\n**Submissions:** ${totalSubmissions} en total.\n- Aprobados: ${aprobados}\n- Pendientes: ${pendientes}\n- Rechazados: ${rechazados}\n\n**Tasa de aprobación:** ${tasaAprobacion}%`
  }

  if (q.includes('rechazado')) {
    return `Se han rechazado **${rechazados}** submissions de un total de ${totalSubmissions}.`
  }

  if (q.includes('aprobación') || q.includes('aprobacion') || q.includes('tasa')) {
    return `La tasa de aprobación actual es del **${tasaAprobacion}%** (${aprobados} aprobados de ${totalSubmissions} submissions).`
  }

  if (q.includes('aprobado')) {
    return `Se han aprobado **${aprobados}** submissions de un total de ${totalSubmissions}.`
  }

  if (q.includes('usuario')) {
    return `La organización cuenta con **${totalUsers}** usuarios registrados, de los cuales ${activeUsers} están activos.`
  }

  if (q.includes('submission') || q.includes('formulario')) {
    return `Hay **${totalSubmissions}** submissions registrados: ${aprobados} aprobados, ${pendientes} pendientes y ${rechazados} rechazados.`
  }

  return `Basándome en los datos del dashboard:\n\n- **${totalUsers}** usuarios (${activeUsers} activos)\n- **${totalSubmissions}** submissions en total\n- Aprobados: ${aprobados} | Pendientes: ${pendientes} | Rechazados: ${rechazados}\n- Tasa de aprobación: ${tasaAprobacion}%\n\n¿Quieres saber algo más específico?`
}

// ── Burbujas de chat ───────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end items-end gap-2">
      <div className="max-w-[72%] px-3.5 py-2.5 rounded-[12px_12px_4px_12px] bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.25)] text-sm text-[var(--off-white)] font-dm leading-relaxed break-words">
        {content}
      </div>
      <div className="w-7 h-7 rounded-full bg-[var(--signal-dim)] border border-white/10 flex items-center justify-center shrink-0 text-[var(--signal)]">
        <User className="w-3.5 h-3.5" />
      </div>
    </div>
  )
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-[var(--amber)]">
        <Bot className="w-3.5 h-3.5" />
      </div>
      <div className="glass max-w-[72%] px-3.5 py-2.5 rounded-[12px_12px_12px_4px] text-sm text-[var(--off-white)] font-dm leading-relaxed break-words">
        <ReactMarkdown
          components={{
            p:      ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="text-[var(--signal)] font-bold">{children}</strong>,
            h3:     ({ children }) => <h3 className="text-sm font-bold font-['Syne'] mb-2">{children}</h3>,
            ul:     ({ children }) => <ul className="my-1 pl-4 list-disc">{children}</ul>,
            li:     ({ children }) => <li className="mb-0.5">{children}</li>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

const BOUNCE_DELAYS = ['[animation-delay:0s]', '[animation-delay:0.2s]', '[animation-delay:0.4s]'] as const

function TypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-[var(--amber)]">
        <Bot className="w-3.5 h-3.5" />
      </div>
      <div className="glass-card-md px-4 py-3 rounded-[12px_12px_12px_4px] flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-bounce ${BOUNCE_DELAYS[i]}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

const INITIAL_MESSAGE: Message = {
  role:    'assistant',
  content: 'Hola! Soy el asistente de Señal. Puedo responderte preguntas sobre los datos del panel: usuarios, submissions, estados y estadísticas. ¿En qué te puedo ayudar?',
}

export default function AdminChatPage() {
  const user        = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function enviarMensaje(texto: string) {
    const trimmed = texto.trim()
    if (!trimmed || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)

    // Simular latencia de procesamiento
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))

    // Intentar obtener stats de la caché de React Query
    const stats = queryClient.getQueryData<DashboardStats>(
      QK.submissions.stats({}),
    )
    const respuesta = generarRespuesta(trimmed, stats)

    setMessages((prev) => [...prev, { role: 'assistant', content: respuesta }])
    setLoading(false)

    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    enviarMensaje(input)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje(input)
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const target = e.currentTarget
    target.style.height = 'auto'
    target.style.height = Math.min(target.scrollHeight, 120) + 'px'
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <div className="flex flex-col gap-0 h-[calc(100vh-5rem)] min-h-[500px]">
      {/* Encabezado */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="h-5 w-5 text-[var(--signal)] animate-pulse" />
          <h1 className="text-2xl font-bold text-[var(--off-white)] font-display">
            Señal IA
          </h1>
        </div>
        <p className="text-sm text-[var(--muted)] mt-0.5 font-dm">
          Consulta datos del panel con lenguaje natural
        </p>
      </div>

      {/* Área de mensajes */}
      <div className="glass-card flex-1 overflow-y-auto p-5 flex flex-col gap-4 mb-3">
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <UserBubble key={i} content={msg.content} />
          ) : (
            <AssistantBubble key={i} content={msg.content} />
          ),
        )}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Preguntas rápidas */}
      <div className="flex gap-2 flex-wrap mb-2.5 shrink-0">
        {QUICK_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => enviarMensaje(q)}
            disabled={loading}
            title={q}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--navy-mid)] border border-white/10 rounded-full text-[var(--muted)] text-[11px] font-['DM_Sans'] font-medium hover:text-[var(--off-white)] hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden max-w-full"
          >
            <Zap className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate max-w-[200px]">{q}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="glass-card-md flex items-end gap-2.5 px-3 py-2.5 shrink-0"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Escribe tu pregunta… (Enter para enviar)"
          disabled={loading}
          rows={1}
          aria-label="Pregunta al asistente"
          className="flex-1 resize-none bg-transparent border-none outline-none text-[var(--off-white)] text-sm font-['DM_Sans'] leading-relaxed py-1 placeholder:text-[var(--muted)] overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar mensaje"
          className="w-9 h-9 rounded-full btn-primary-gradient flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
