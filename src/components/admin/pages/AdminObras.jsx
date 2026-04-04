import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Building2, MapPin, Power, Plus, X } from "lucide-react";
import { useAdminRole } from "../hooks/useAdminRole";
import { useObras, useAgregarObra, useToggleObra } from "../hooks/useObras";
import StatusBadge from "../shared/StatusBadge";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";

/** Modal para agregar nueva obra */
function AgregarObraModal({ open, onOpenChange, empresaId }) {
  const agregarMutation = useAgregarObra();
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    empresa_id: empresaId ?? "",
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.nombre) {
      setError("El nombre de la obra es requerido.");
      return;
    }
    try {
      await agregarMutation.mutateAsync({ ...form, empresa_id: empresaId });
      onOpenChange(false);
      setForm({ nombre: "", direccion: "", ciudad: "", empresa_id: empresaId ?? "" });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al agregar la obra.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content className="glass-card" style={dialogContentStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Dialog.Title style={dialogTitleStyle}>Agregar Obra</Dialog.Title>
            <Dialog.Close asChild>
              <button style={iconBtnStyle} aria-label="Cerrar"><X size={18} /></button>
            </Dialog.Close>
          </div>
          <Dialog.Description style={{ display: "none" }}>
            Formulario para registrar una nueva obra en la plataforma.
          </Dialog.Description>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField label="Nombre de la obra *" name="nombre"    value={form.nombre}    onChange={handleChange} required placeholder="Ej: Proyecto Torres Norte" />
            <FormField label="Dirección"            name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, carrera, número…" />
            <FormField label="Ciudad"               name="ciudad"    value={form.ciudad}    onChange={handleChange} placeholder="Ej: Bogotá" />

            {error && (
              <p style={{ margin: 0, fontSize: 13, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Dialog.Close asChild>
                <button type="button" style={cancelBtnStyle}>Cancelar</button>
              </Dialog.Close>
              <button type="submit" disabled={agregarMutation.isPending} style={primaryBtnStyle}>
                {agregarMutation.isPending ? "Guardando…" : "Agregar obra"}
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
        {label}
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
 * AdminObras — gestión de obras activas e inactivas de la empresa.
 */
export default function AdminObras() {
  const { empresaId } = useAdminRole();
  const { data, isLoading, isError, error, refetch } = useObras(empresaId);
  const toggleObra  = useToggleObra();
  const [modalOpen, setModalOpen] = useState(false);

  const obras = Array.isArray(data) ? data : data?.obras ?? data?.items ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Cabecera ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={pageTitleStyle}>Obras</h1>
          <p style={pageSubtitleStyle}>Administra los sitios de trabajo de la empresa</p>
        </div>
        <button onClick={() => setModalOpen(true)} style={primaryBtnStyle}>
          <Plus size={15} />
          Agregar obra
        </button>
      </div>

      {/* ── Contenido ── */}
      {isLoading ? (
        <LoadingSpinner height="300px" />
      ) : isError ? (
        <ErrorMessage
          message={error?.message || "No se pudieron cargar las obras."}
          onRetry={refetch}
        />
      ) : obras.length === 0 ? (
        <div style={emptyStyle}>No hay obras registradas.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {obras.map((obra) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              onToggle={() => toggleObra.mutate({ id: obra.id })}
              toggling={toggleObra.isPending}
            />
          ))}
        </div>
      )}

      <AgregarObraModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        empresaId={empresaId}
      />
    </div>
  );
}

/** Tarjeta individual de obra */
function ObraCard({ obra, onToggle, toggling }) {
  const activa = obra.activa ?? obra.activo ?? obra.estado === "activo" ?? true;

  return (
    <div className="glass-card-md" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Icono + Nombre */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: activa ? "var(--signal-dim)" : "rgba(150,150,150,0.1)",
            color: activa ? "var(--signal)" : "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2 size={20} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--off-white)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {obra.nombre || "Sin nombre"}
          </div>
          <StatusBadge status={activa ? "activo" : "inactivo"} />
        </div>
      </div>

      {/* Dirección / Ciudad */}
      {(obra.direccion || obra.ciudad) && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <MapPin size={13} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
            {[obra.direccion, obra.ciudad].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

      {/* Coordenadas si disponibles */}
      {(obra.lat != null && obra.lon != null) && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif", opacity: 0.7 }}>
          {Number(obra.lat).toFixed(5)}, {Number(obra.lon).toFixed(5)}
        </div>
      )}

      {/* Acción toggle */}
      <button
        onClick={onToggle}
        disabled={toggling}
        style={{
          ...actionBtnStyle,
          color: activa ? "#ef4444" : "#22c55e",
          marginTop: 4,
        }}
      >
        <Power size={13} />
        {activa ? "Desactivar obra" : "Activar obra"}
      </button>
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
  gap: 6,
  padding: "7px 12px",
  marginBottom: 0,
  background: "rgba(22,34,56,0.5)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-btn, 8px)",
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
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
const emptyStyle = {
  textAlign: "center",
  padding: "60px 20px",
  color: "var(--muted)",
  fontSize: 14,
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
  width: "min(480px, calc(100vw - 32px))",
  padding: "28px",
  outline: "none",
};
const dialogTitleStyle = {
  margin: 0,
  fontFamily: "'Syne', sans-serif",
  fontSize: 18,
  fontWeight: 700,
  color: "var(--off-white)",
};
