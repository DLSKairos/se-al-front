import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminRole } from "../hooks/useAdminRole";
import { usePermisos } from "../hooks/usePermisos";
import StatusBadge from "../shared/StatusBadge";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import api from "../../../utils/api";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "aprobado",  label: "Aprobado"  },
  { value: "pendiente", label: "Pendiente" },
  { value: "rechazado", label: "Rechazado" },
];

/** Genera y descarga un CSV a partir de un array de objetos */
function descargarCSV(datos, nombreArchivo = "permisos.csv") {
  if (!datos?.length) return;
  const columnas = Object.keys(datos[0]);
  const encabezado = columnas.join(",");
  const filas = datos.map((fila) =>
    columnas.map((col) => {
      const val = fila[col] ?? "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );
  const csv = [encabezado, ...filas].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  link.click();
  URL.revokeObjectURL(url);
}

/** Formatea una fecha ISO para mostrar en tabla */
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

/** Modal de detalle de un permiso */
function PermisoDetailDialog({ permiso, open, onOpenChange }) {
  if (!permiso) return null;

  const campos = Object.entries(permiso).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content className="glass-card" style={dialogContentStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Dialog.Title style={dialogTitleStyle}>Detalle del Permiso</Dialog.Title>
            <Dialog.Close asChild>
              <button style={iconBtnStyle} aria-label="Cerrar">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description style={{ display: "none" }}>
            Información completa del permiso de trabajo seleccionado.
          </Dialog.Description>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: "65vh" }}>
            {campos.map(([key, value]) => (
              <div key={key} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={detailLabelStyle}>{formatKey(key)}</span>
                {key === "estado" ? (
                  <StatusBadge status={String(value)} />
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

/** Convierte snake_case a "Título Con Mayúscula" */
function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * AdminPermisos — gestión y búsqueda de permisos de trabajo.
 */
export default function AdminPermisos() {
  const { empresaId } = useAdminRole();
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("");
  const [page, setPage]         = useState(1);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [dialogOpen, setDialogOpen]                   = useState(false);
  const [exportando, setExportando]                   = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = usePermisos({
    empresaId,
    search,
    status,
    page,
    limit: 20,
  });

  /* Normalizar respuesta del backend (puede ser array o { items, total }) */
  const items      = Array.isArray(data) ? data : data?.items ?? data?.permisos ?? [];
  const totalPages = data?.totalPages ?? data?.total_pages ?? null;
  const hasMore    = totalPages ? page < totalPages : items.length === 20;

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleStatusChange(e) {
    setStatus(e.target.value);
    setPage(1);
  }

  function abrirDetalle(permiso) {
    setPermisoSeleccionado(permiso);
    setDialogOpen(true);
  }

  async function handleExportarPDF() {
    setExportando(true);
    try {
      const resp = await api.post(
        "/permiso_trabajo_admin/descargar",
        { empresa_id: empresaId, formato: "pdf", search, estado: status || undefined },
        { responseType: "blob" }
      );
      const url  = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "permisos.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo descargar el PDF. Intenta de nuevo.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Cabecera ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={pageTitleStyle}>Permisos de Trabajo</h1>
          <p style={pageSubtitleStyle}>Busca, filtra y exporta permisos de la plataforma</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => descargarCSV(items, "permisos.csv")}
            disabled={!items.length}
            style={secondaryBtnStyle}
            title="Exportar CSV"
          >
            <Download size={15} />
            CSV
          </button>
          <button
            onClick={handleExportarPDF}
            disabled={exportando}
            style={secondaryBtnStyle}
            title="Exportar PDF"
          >
            <FileText size={15} />
            {exportando ? "Exportando…" : "PDF"}
          </button>
        </div>
      </div>

      {/* ── Toolbar de filtros ── */}
      <div className="glass-card-md" style={{ padding: "14px 18px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* Búsqueda */}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search
            size={15}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}
          />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, tipo, obra…"
            style={inputStyle}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              style={{ ...iconBtnStyle, position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro de estado */}
        <select
          value={status}
          onChange={handleStatusChange}
          style={selectStyle}
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Tabla ── */}
      <div className="glass-card" style={{ padding: 20 }}>
        {isLoading ? (
          <LoadingSpinner height="300px" />
        ) : isError ? (
          <ErrorMessage
            message={error?.message || "No se pudieron cargar los permisos."}
            onRetry={refetch}
          />
        ) : items.length === 0 ? (
          <div style={emptyStyle}>Sin resultados para los filtros aplicados.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {isFetching && !isLoading && (
              <div style={{ height: 2, background: "var(--signal)", borderRadius: 1, marginBottom: 8, opacity: 0.6 }} />
            )}
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["Tipo", "Usuario", "Ubicación", "Estado", "Fecha", ""].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p.id ?? i}
                    style={i % 2 === 0 ? trEvenStyle : {}}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "rgba(22,34,56,0.3)" : "")}
                  >
                    <td style={tdStyle}>{p.tipo ?? p.tipo_permiso ?? "—"}</td>
                    <td style={tdStyle}>{p.usuario ?? p.nombre ?? p.trabajador ?? "—"}</td>
                    <td style={tdStyle}>{p.ubicacion ?? p.obra ?? p.lugar ?? "—"}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={p.estado} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {formatFecha(p.fecha ?? p.created_at ?? p.fecha_inicio)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button
                        onClick={() => abrirDetalle(p)}
                        style={verBtnStyle}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginación ── */}
        {!isLoading && !isError && items.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>
              Página {page}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={paginationBtnStyle(page === 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft size={15} />
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                style={paginationBtnStyle(!hasMore)}
                aria-label="Página siguiente"
              >
                Siguiente
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog de detalle ── */}
      <PermisoDetailDialog
        permiso={permisoSeleccionado}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

/* ── Estilos compartidos ── */
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
  padding: "9px 32px 9px 32px",
  background: "rgba(22,34,56,0.6)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-input, 10px)",
  color: "var(--off-white)",
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  padding: "9px 12px",
  background: "rgba(22,34,56,0.8)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-input, 10px)",
  color: "var(--off-white)",
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  cursor: "pointer",
  minWidth: 160,
};

const secondaryBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  marginBottom: 0,
  background: "var(--signal-dim)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-btn, 8px)",
  color: "var(--signal)",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
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

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
};
const thStyle = {
  padding: "8px 12px",
  textAlign: "left",
  color: "var(--muted)",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--glass-border)",
  whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "10px 12px",
  color: "var(--off-white)",
  borderBottom: "1px solid rgba(0,212,255,0.05)",
  verticalAlign: "middle",
};
const trEvenStyle = { background: "rgba(22,34,56,0.3)" };

const verBtnStyle = {
  padding: "5px 12px",
  marginBottom: 0,
  background: "var(--signal-dim)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-btn, 8px)",
  color: "var(--signal)",
  fontSize: 12,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  cursor: "pointer",
};

const emptyStyle = {
  textAlign: "center",
  padding: "60px 20px",
  color: "var(--muted)",
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
};

const paginationBtnStyle = (disabled) => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "7px 14px",
  marginBottom: 0,
  background: disabled ? "transparent" : "var(--signal-dim)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-btn, 8px)",
  color: disabled ? "var(--muted)" : "var(--signal)",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

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
  width: "min(560px, calc(100vw - 32px))",
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
