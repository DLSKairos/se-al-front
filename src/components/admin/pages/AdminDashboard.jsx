import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Users,
  UserCheck,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useAdminRole } from "../hooks/useAdminRole";
import { useDashboardStats } from "../hooks/useDashboardStats";
import StatCard from "../shared/StatCard";
import StatusBadge from "../shared/StatusBadge";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";

/* Colores semánticos del design system */
const PIE_COLORS = {
  Aprobados: "#22c55e",
  Pendientes: "#F5A623",
  Rechazados: "#ef4444",
};

/* Tooltip personalizado con fondo glass */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass-card-md"
      style={{ padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
    >
      <div style={{ color: "var(--muted)", marginBottom: 4 }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  );
}

/* Formatea fecha ISO a "dd/mm" */
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

/**
 * AdminDashboard — vista principal del panel admin.
 *
 * Muestra KPIs, tendencia mensual, distribución por estado y tipo,
 * y una tabla de permisos recientes.
 */
export default function AdminDashboard() {
  const { empresaId } = useAdminRole();
  const { data, isLoading, isError, error, refetch } = useDashboardStats(empresaId);

  if (isLoading) return <LoadingSpinner height="400px" />;
  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || "No se pudo cargar el dashboard."}
        onRetry={refetch}
      />
    );
  }

  const {
    totalUsers = 0,
    activeUsers = 0,
    totalPermisos = 0,
    aprobados = 0,
    pendientes = 0,
    rechazados = 0,
    monthlyTrend = [],
    byStatus = [],
    byType = [],
    recentPermisos = [],
  } = data ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Título ── */}
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--off-white)",
          }}
        >
          Dashboard
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>
          Resumen general de la plataforma
        </p>
      </div>

      {/* ── KPI Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        <StatCard title="Total Usuarios"  value={totalUsers}   icon={Users}       variant="default"     />
        <StatCard title="Usuarios Activos" value={activeUsers}  icon={UserCheck}   variant="success"     />
        <StatCard title="Total Permisos"  value={totalPermisos} icon={FileText}    variant="default"     />
        <StatCard title="Aprobados"       value={aprobados}    icon={CheckCircle} variant="success"     />
        <StatCard title="Pendientes"      value={pendientes}   icon={Clock}       variant="warning"     />
        <StatCard title="Rechazados"      value={rechazados}   icon={XCircle}     variant="destructive" />
      </div>

      {/* ── Tendencia mensual ── */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={sectionTitle}>Tendencia Mensual</h2>
        {monthlyTrend.length === 0 ? (
          <EmptyChart message="Sin datos de tendencia aún" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTrend} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
              <XAxis
                dataKey="mes"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}
              />
              <Line
                type="monotone"
                dataKey="permisos"
                name="Permisos"
                stroke="var(--signal)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--signal)" }}
              />
              <Line
                type="monotone"
                dataKey="usuarios"
                name="Usuarios"
                stroke="var(--amber)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--amber)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Distribución: Pie + Bar ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* Pie por estado */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={sectionTitle}>Por Estado</h2>
          {byStatus.every((s) => s.value === 0) ? (
            <EmptyChart message="Sin datos de estado aún" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {byStatus.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[entry.name] || "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar por tipo */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={sectionTitle}>Por Tipo de Permiso</h2>
          {byType.length === 0 ? (
            <EmptyChart message="Sin datos por tipo aún" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={byType}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Permisos" fill="var(--signal)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Tabla de permisos recientes ── */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={sectionTitle}>Permisos Recientes</h2>
        {recentPermisos.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            No hay permisos recientes para mostrar.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["Nombre", "Tipo", "Obra", "Estado", "Fecha"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPermisos.map((p, i) => (
                  <tr key={p.id ?? i} style={i % 2 === 0 ? trEvenStyle : {}}>
                    <td style={tdStyle}>{p.nombre || p.usuario || "—"}</td>
                    <td style={tdStyle}>{p.tipo || "—"}</td>
                    <td style={tdStyle}>{p.obra || p.ubicacion || "—"}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={p.estado} />
                    </td>
                    <td style={tdStyle}>{formatDate(p.fecha || p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers de estilos ── */
const sectionTitle = {
  margin: "0 0 16px",
  fontFamily: "'Syne', sans-serif",
  fontSize: 15,
  fontWeight: 600,
  color: "var(--off-white)",
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

const trEvenStyle = {
  background: "rgba(22,34,56,0.3)",
};

function EmptyChart({ message }) {
  return (
    <div
      style={{
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--muted)",
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {message}
    </div>
  );
}
