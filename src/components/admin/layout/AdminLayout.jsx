import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

/**
 * AdminLayout — estructura de cuadrícula del panel admin.
 *
 * Grid de 2 columnas × 2 filas:
 *   Col 1 (auto)  | Col 2 (1fr)
 *   ─────────────────────────────
 *   Sidebar       | Header       ← row 1 (56px)
 *   Sidebar       | <Outlet />   ← row 2 (1fr)
 *
 * El sidebar ocupa ambas filas (span 1 / 3) para quedarse fijo a la izquierda
 * mientras el header y el contenido principal se apilan en la columna derecha.
 *
 * Decisiones de diseño:
 *   - collapsed arranca en true en mobile (≤768px) para no tapar el contenido.
 *   - El área de contenido tiene overflow-y auto para scrollear sin mover el sidebar.
 *   - Fondo navy garantiza que los huecos del grid no queden transparentes.
 */
function AdminLayout() {
  const [collapsed, setCollapsed] = useState(
    () => window.innerWidth < 768
  );

  /* Colapsar automáticamente al cambiar a mobile */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCollapsed(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggle = () => setCollapsed((prev) => !prev);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gridTemplateRows: "56px 1fr",
        minHeight: "100vh",
        background: "var(--navy)",
      }}
    >
      {/* Sidebar — span filas 1 y 2 */}
      <AdminSidebar collapsed={collapsed} onToggle={handleToggle} />

      {/* Header — fila 1, columna 2 */}
      <AdminHeader onToggle={handleToggle} />

      {/* Área de contenido principal — fila 2, columna 2 */}
      <main
        style={{
          gridRow: "2",
          gridColumn: "2",
          overflowY: "auto",
          padding: "24px",
          background: "var(--navy)",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
