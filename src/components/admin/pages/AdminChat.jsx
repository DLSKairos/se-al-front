import React, { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAdminRole } from "../hooks/useAdminRole";

/** Preguntas rápidas predefinidas */
const QUICK_QUERIES = [
  "¿Cuántos permisos pendientes hay?",
  "¿Cuántos usuarios activos tiene la empresa?",
  "Dame un resumen del panel",
  "¿Cuántos permisos fueron rechazados?",
  "¿Cuál es la tasa de aprobación de permisos?",
];

/**
 * Genera una respuesta en texto plano a partir de los datos del dashboard en
 * caché. Se ejecuta completamente en el cliente — sin llamada al backend.
 */
function generarRespuesta(pregunta, datos) {
  if (!datos) {
    return "No tengo datos disponibles en este momento. Asegúrate de haber cargado el dashboard primero.";
  }

  const q = pregunta.toLowerCase();
  const {
    totalUsers = 0,
    activeUsers = 0,
    totalPermisos = 0,
    aprobados = 0,
    pendientes = 0,
    rechazados = 0,
  } = datos;

  const tasaAprobacion =
    totalPermisos > 0 ? ((aprobados / totalPermisos) * 100).toFixed(1) : "0";

  if (q.includes("pendiente")) {
    return `Hay **${pendientes}** permisos en estado pendiente de un total de ${totalPermisos} permisos registrados.`;
  }

  if (q.includes("usuario") && q.includes("activo")) {
    return `La empresa tiene **${activeUsers}** usuarios activos de un total de ${totalUsers} usuarios registrados.`;
  }

  if (q.includes("resumen") || q.includes("panel")) {
    return `### Resumen del Panel\n\n**Usuarios:** ${totalUsers} registrados, ${activeUsers} activos.\n\n**Permisos:** ${totalPermisos} en total.\n- Aprobados: ${aprobados}\n- Pendientes: ${pendientes}\n- Rechazados: ${rechazados}\n\n**Tasa de aprobación:** ${tasaAprobacion}%`;
  }

  if (q.includes("rechazado")) {
    return `Se han rechazado **${rechazados}** permisos de un total de ${totalPermisos}.`;
  }

  if (q.includes("aprobación") || q.includes("aprobacion") || q.includes("tasa")) {
    return `La tasa de aprobación actual es del **${tasaAprobacion}%** (${aprobados} aprobados de ${totalPermisos} permisos).`;
  }

  if (q.includes("aprobado")) {
    return `Se han aprobado **${aprobados}** permisos de un total de ${totalPermisos}.`;
  }

  if (q.includes("usuario")) {
    return `La empresa cuenta con **${totalUsers}** usuarios registrados, de los cuales ${activeUsers} están activos.`;
  }

  if (q.includes("permiso")) {
    return `Hay **${totalPermisos}** permisos registrados: ${aprobados} aprobados, ${pendientes} pendientes y ${rechazados} rechazados.`;
  }

  // Respuesta genérica con resumen
  return `Basándome en los datos del dashboard:\n\n- **${totalUsers}** usuarios (${activeUsers} activos)\n- **${totalPermisos}** permisos en total\n- Aprobados: ${aprobados} | Pendientes: ${pendientes} | Rechazados: ${rechazados}\n- Tasa de aprobación: ${tasaAprobacion}%\n\n¿Quieres saber algo más específico?`;
}

/** Burbuja de mensaje del usuario */
function UserBubble({ content }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "flex-end" }}>
      <div
        className="glass-card-md"
        style={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderColor: "var(--signal)",
          border: "1px solid rgba(0,212,255,0.3)",
          borderRadius: "12px 12px 4px 12px",
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--off-white)",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {content}
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--signal-dim)",
          border: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--signal)",
        }}
      >
        <User size={14} />
      </div>
    </div>
  );
}

/** Burbuja de mensaje del asistente */
function AssistantBubble({ content }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", gap: 8, alignItems: "flex-end" }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(245,166,35,0.15)",
          border: "1px solid rgba(245,166,35,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--amber)",
        }}
      >
        <Bot size={14} />
      </div>
      <div
        className="glass-card-md"
        style={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderRadius: "12px 12px 12px 4px",
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--off-white)",
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        <ReactMarkdown
          components={{
            p:      ({ children }) => <p style={{ margin: "0 0 6px" }}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: "var(--signal)", fontWeight: 700 }}>{children}</strong>,
            h3:     ({ children }) => <h3 style={{ margin: "0 0 8px", fontSize: 14, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{children}</h3>,
            ul:     ({ children }) => <ul style={{ margin: "4px 0 6px", paddingLeft: 18 }}>{children}</ul>,
            li:     ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/** Indicador de escritura animado */
function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", gap: 8, alignItems: "flex-end" }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(245,166,35,0.15)",
          border: "1px solid rgba(245,166,35,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--amber)",
        }}
      >
        <Bot size={14} />
      </div>
      <div
        className="glass-card-md"
        style={{
          padding: "12px 16px",
          borderRadius: "12px 12px 12px 4px",
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--amber)",
              animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * AdminChat — interfaz de chat con IA que responde sobre los datos del panel.
 *
 * Las respuestas se generan localmente a partir de los datos en caché de
 * React Query (queryKey: ["dashboard", empresaId]). No realiza ninguna
 * llamada al backend.
 */
export default function AdminChat() {
  const { empresaId } = useAdminRole();
  const queryClient   = useQueryClient();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hola! Soy el asistente de Señal. Puedo responderte preguntas sobre los datos del panel: usuarios, permisos, estados y estadísticas. ¿En qué te puedo ayudar?",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  /* Auto-scroll al último mensaje */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function enviarMensaje(texto) {
    const trimmed = texto.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    /* Simular latencia de procesamiento */
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const dashboardData = queryClient.getQueryData(["dashboard", empresaId]);
    const respuesta = generarRespuesta(trimmed, dashboardData);

    setMessages((prev) => [...prev, { role: "assistant", content: respuesta }]);
    setLoading(false);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSubmit(e) {
    e.preventDefault();
    enviarMensaje(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje(input);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 500, gap: 0 }}>

      {/* ── Cabecera ── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={pageTitleStyle}>Señal IA</h1>
        <p style={pageSubtitleStyle}>Consulta datos del panel con lenguaje natural</p>
      </div>

      {/* ── Área de mensajes ── */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 12,
        }}
      >
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserBubble key={i} content={msg.content} />
          ) : (
            <AssistantBubble key={i} content={msg.content} />
          )
        )}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick queries ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {QUICK_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => enviarMensaje(q)}
            disabled={loading}
            style={quickBtnStyle}
            title={q}
          >
            <Zap size={11} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 200,
              }}
            >
              {q}
            </span>
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <form
        onSubmit={handleSubmit}
        className="glass-card-md"
        style={{
          display: "flex",
          gap: 10,
          padding: "10px 12px",
          alignItems: "flex-end",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta… (Enter para enviar)"
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--off-white)",
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.5,
            padding: "4px 0",
            maxHeight: 120,
            overflowY: "auto",
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            ...sendBtnStyle,
            opacity: !input.trim() || loading ? 0.4 : 1,
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
          }}
          aria-label="Enviar mensaje"
        >
          <Send size={16} />
        </button>
      </form>

      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}

/* ── Estilos ── */
const pageTitleStyle = {
  margin: 0,
  fontFamily: "'Syne', sans-serif",
  fontSize: 26,
  fontWeight: 700,
  color: "var(--off-white)",
};
const pageSubtitleStyle = {
  margin: "4px 0 0",
  fontSize: 14,
  color: "var(--muted)",
  fontFamily: "'DM Sans', sans-serif",
};
const quickBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 10px",
  marginBottom: 0,
  background: "rgba(22,34,56,0.6)",
  border: "1px solid var(--glass-border)",
  borderRadius: 20,
  color: "var(--muted)",
  fontSize: 11,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
  cursor: "pointer",
  transition: "color 0.15s, border-color 0.15s",
  maxWidth: "100%",
  overflow: "hidden",
};
const sendBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  marginBottom: 0,
  borderRadius: "50%",
  background: "var(--signal)",
  border: "none",
  color: "var(--navy)",
  flexShrink: 0,
  transition: "opacity 0.2s",
};
