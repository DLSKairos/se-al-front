import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, UserPlus, Power, KeyRound } from "lucide-react";
import { useAdminRole } from "../hooks/useAdminRole";
import {
  useUsuarios,
  useToggleEstado,
  useTogglePin,
  useAgregarUsuario,
} from "../hooks/useUsuarios";
import StatusBadge from "../shared/StatusBadge";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import ConfirmModal from "../shared/ConfirmModal";

/** Formatea fecha ISO o devuelve "—" */
function formatFecha(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Modal de detalle de usuario */
function UsuarioDialog({ usuario, open, onOpenChange }) {
  if (!usuario) return null;
  const campos = Object.entries(usuario).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content className="glass-card" style={dialogContentStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Dialog.Title style={dialogTitleStyle}>Detalle de Usuario</Dialog.Title>
            <Dialog.Close asChild>
              <button style={iconBtnStyle} aria-label="Cerrar"><X size={18} /></button>
            </Dialog.Close>
          </div>
          <Dialog.Description style={{ display: "none" }}>
            Información completa del usuario seleccionado.
          </Dialog.Description>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: "60vh" }}>
            {campos.map(([key, value]) => (
              <div key={key} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={detailLabelStyle}>{formatKey(key)}</span>
                {key === "activo" ? (
                  <StatusBadge status={value ? "activo" : "inactivo"} />
                ) : (
                  <span style={detailValueStyle}>{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Modal para agregar nuevo usuario */
function AgregarUsuarioModal({ open, onOpenChange, empresaId }) {
  const agregarMutation = useAgregarUsuario();
  const [form, setForm] = useState({
    numero_identificacion: "",
    nombre: "",
    cargo: "",
    empresa_id: empresaId ?? "",
    activo: true,
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.numero_identificacion || !form.nombre) {
      setError("Número de identificación y nombre son requeridos.");
      return;
    }
    try {
      await agregarMutation.mutateAsync({ ...form, empresa_id: empresaId });
      onOpenChange(false);
      setForm({ numero_identificacion: "", nombre: "", cargo: "", empresa_id: empresaId ?? "", activo: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al agregar el usuario.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content className="glass-card" style={dialogContentStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Dialog.Title style={dialogTitleStyle}>Agregar Usuario</Dialog.Title>
            <Dialog.Close asChild>
              <button style={iconBtnStyle} aria-label="Cerrar"><X size={18} /></button>
            </Dialog.Close>
          </div>
          <Dialog.Description style={{ display: "none" }}>
            Formulario para agregar un nuevo usuario a la empresa.
          </Dialog.Description>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="N° Identificación"
              name="numero_identificacion"
              value={form.numero_identificacion}
              onChange={handleChange}
              required
              placeholder="Ej: 1234567890"
            />
            <FormField
              label="Nombre completo"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Nombre del trabajador"
            />
            <FormField
              label="Cargo"
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              placeholder="Ej: Operario, Supervisor…"
            />

            <label style={checkLabelStyle}>
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
                style={{ accentColor: "var(--signal)", marginRight: 8 }}
              />
              <span style={{ fontSize: 14, color: "var(--off-white)", fontFamily: "'DM Sans', sans-serif" }}>
                Usuario activo
              </span>
            </label>

            {error && (
              <p style={{ margin: 0, fontSize: 13, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Dialog.Close asChild>
                <button type="button" style={cancelBtnStyle}>Cancelar</button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={agregarMutation.isPending}
                style={primaryBtnStyle}
              >
                {agregarMutation.isPending ? "Guardando…" : "Agregar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FormField({ label, name, value, onChange, required, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        htmlFor={name}
        style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.4px" }}
      >
        {label}{required && " *"}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

/**
 * AdminUsuarios — gestión de trabajadores de la empresa.
 */
export default function AdminUsuarios() {
  const { empresaId } = useAdminRole();
  const { data, isLoading, isError, error, refetch } = useUsuarios(empresaId);
  const toggleEstado = useToggleEstado();
  const togglePin    = useTogglePin();

  const [search, setSearch]             = useState("");
  const [modalAgregar, setModalAgregar] = useState(false);
  const [userDetalle, setUserDetalle]   = useState(null);
  const [detalleOpen, setDetalleOpen]   = useState(false);
  const [confirmDesactivar, setConfirmDesactivar] = useState(null); // {id, nombre}

  const usuarios = Array.isArray(data) ? data : data?.usuarios ?? data?.items ?? [];

  const filtrados = usuarios.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.nombre ?? "").toLowerCase().includes(q) ||
      (u.numero_identificacion ?? "").toString().includes(q) ||
      (u.cargo ?? "").toLowerCase().includes(q)
    );
  });

  function handleToggleEstado(usuario) {
    if (usuario.activo) {
      setConfirmDesactivar({ id: usuario.id, nombre: usuario.nombre });
    } else {
      toggleEstado.mutate({ id: usuario.id });
    }
  }

  function abrirDetalle(usuario) {
    setUserDetalle(usuario);
    setDetalleOpen(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Cabecera ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={pageTitleStyle}>Usuarios</h1>
          <p style={pageSubtitleStyle}>Gestión de trabajadores de la empresa</p>
        </div>
        <button
          onClick={() => setModalAgregar(true)}
          style={primaryBtnStyle}
        >
          <UserPlus size={15} />
          Agregar usuario
        </button>
      </div>

      {/* ── Buscador ── */}
      <div className="glass-card-md" style={{ padding: "12px 16px" }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search
            size={15}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o identificación…"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ ...iconBtnStyle, position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Contenido ── */}
      {isLoading ? (
        <LoadingSpinner height="300px" />
      ) : isError ? (
        <ErrorMessage message={error?.message || "No se pudieron cargar los usuarios."} onRetry={refetch} />
      ) : filtrados.length === 0 ? (
        <div style={emptyStyle}>
          {search ? "Sin resultados para la búsqueda." : "No hay usuarios registrados."}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filtrados.map((u) => (
            <UsuarioCard
              key={u.id ?? u.numero_identificacion}
              usuario={u}
              onToggleEstado={() => handleToggleEstado(u)}
              onTogglePin={() => togglePin.mutate({ id: u.id })}
              onVerDetalle={() => abrirDetalle(u)}
              toggleLoading={toggleEstado.isPending || togglePin.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Modales ── */}
      <AgregarUsuarioModal
        open={modalAgregar}
        onOpenChange={setModalAgregar}
        empresaId={empresaId}
      />

      <UsuarioDialog
        usuario={userDetalle}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
      />

      <ConfirmModal
        open={!!confirmDesactivar}
        onOpenChange={(v) => !v && setConfirmDesactivar(null)}
        title="Desactivar usuario"
        description={`¿Estás seguro de que quieres desactivar a ${confirmDesactivar?.nombre ?? "este usuario"}? No podrá acceder a la plataforma.`}
        confirmLabel="Desactivar"
        variant="destructive"
        onConfirm={() => {
          toggleEstado.mutate({ id: confirmDesactivar.id });
          setConfirmDesactivar(null);
        }}
      />
    </div>
  );
}

/** Tarjeta individual de usuario */
function UsuarioCard({ usuario, onToggleEstado, onTogglePin, onVerDetalle, toggleLoading }) {
  const activo = usuario.activo ?? usuario.estado === "activo" ?? false;
  const pinHabilitado = usuario.pin_habilitado ?? usuario.tiene_pin ?? false;

  return (
    <div className="glass-card-md" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Cabecera de card */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: "var(--off-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {usuario.nombre || "Sin nombre"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
            {usuario.cargo || "Sin cargo"}
          </div>
        </div>

        {/* Dot de estado activo */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: activo ? "#22c55e" : "#6b7280",
            boxShadow: activo ? "0 0 6px #22c55e" : "none",
            flexShrink: 0,
            marginTop: 4,
          }}
          title={activo ? "Activo" : "Inactivo"}
        />
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatusBadge status={activo ? "activo" : "inactivo"} />
        {pinHabilitado && (
          <span style={pinBadgeStyle}>
            <KeyRound size={10} />
            PIN habilitado
          </span>
        )}
      </div>

      {/* Meta */}
      <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>
        {usuario.numero_identificacion && (
          <div>ID: {usuario.numero_identificacion}</div>
        )}
        {(usuario.ultimo_acceso ?? usuario.last_login) && (
          <div>Último acceso: {formatFecha(usuario.ultimo_acceso ?? usuario.last_login)}</div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        <button
          onClick={onToggleEstado}
          disabled={toggleLoading}
          style={{ ...actionBtnStyle, color: activo ? "#ef4444" : "#22c55e" }}
          title={activo ? "Desactivar" : "Activar"}
        >
          <Power size={13} />
          {activo ? "Desactivar" : "Activar"}
        </button>

        <button
          onClick={onTogglePin}
          disabled={toggleLoading}
          style={{ ...actionBtnStyle, color: "var(--amber)" }}
          title={pinHabilitado ? "Deshabilitar PIN" : "Habilitar PIN"}
        >
          <KeyRound size={13} />
          {pinHabilitado ? "Quitar PIN" : "Dar PIN"}
        </button>

        <button
          onClick={onVerDetalle}
          style={{ ...actionBtnStyle, color: "var(--signal)", marginLeft: "auto" }}
        >
          Ver detalle
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  background: "rgba(22,34,56,0.6)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-input, 10px)",
  color: "var(--off-white)",
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};
const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 18px",
  marginBottom: 0,
  background: "var(--signal)",
  border: "none",
  borderRadius: "var(--radius-btn, 8px)",
  color: "var(--navy)",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  cursor: "pointer",
};
const cancelBtnStyle = {
  padding: "9px 16px",
  marginBottom: 0,
  background: "transparent",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-btn, 8px)",
  color: "var(--muted)",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
};
const actionBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 10px",
  marginBottom: 0,
  background: "rgba(22,34,56,0.5)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-btn, 8px)",
  fontSize: 12,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
};
const checkLabelStyle = {
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};
const emptyStyle = {
  textAlign: "center",
  padding: "60px 20px",
  color: "var(--muted)",
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
};
const pinBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 8px",
  borderRadius: "var(--radius-badge, 4px)",
  background: "var(--amber-dim)",
  color: "var(--amber)",
  fontSize: 11,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
};
const iconBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 4,
  marginBottom: 0,
  background: "transparent",
  border: "none",
  color: "var(--muted)",
  cursor: "pointer",
  borderRadius: 6,
};
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.65)",
  backdropFilter: "blur(4px)",
  zIndex: 1000,
};
const dialogContentStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 1001,
  width: "min(500px, calc(100vw - 32px))",
  maxHeight: "85vh",
  padding: "28px",
  outline: "none",
  display: "flex",
  flexDirection: "column",
};
const dialogTitleStyle = {
  margin: 0,
  fontFamily: "'Syne', sans-serif",
  fontSize: 18,
  fontWeight: 700,
  color: "var(--off-white)",
};
const detailLabelStyle = {
  width: 140,
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
  fontFamily: "'DM Sans', sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  paddingTop: 2,
};
const detailValueStyle = {
  fontSize: 14,
  color: "var(--off-white)",
  fontFamily: "'DM Sans', sans-serif",
  wordBreak: "break-word",
};
