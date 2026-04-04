import { Navigate, Outlet } from "react-router-dom";

/**
 * AdminGuard — protección de rutas del panel /admin.
 *
 * Si no existe ninguna clave de rol admin en localStorage, redirige al root.
 * Soporta tanto la clave nueva "admin_rol" como las claves legadas.
 */
export default function AdminGuard() {
  const rol =
    localStorage.getItem("admin_rol") ||
    localStorage.getItem("rol_admin") ||
    localStorage.getItem("rol");

  if (!rol) return <Navigate to="/" replace />;
  return <Outlet />;
}
