import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook que expone el rol del administrador autenticado y la función de logout.
 *
 * Soporta tanto la clave "admin_rol" (nuevo panel /admin) como las claves
 * legadas "rol_admin" y "rol" para no romper el flujo antiguo.
 *
 * empresaId se lee directamente de "admin_empresa_id" en localStorage,
 * almacenado durante el login por el backend.
 */
export function useAdminRole() {
  const navigate = useNavigate();

  const rol = (
    localStorage.getItem("admin_rol") ||
    localStorage.getItem("rol_admin") ||
    localStorage.getItem("rol") ||
    ""
  ).toLowerCase();

  const empresaId =
    parseInt(localStorage.getItem("admin_empresa_id") || "", 10) || null;

  const logout = useCallback(() => {
    const keysToRemove = [
      "admin_rol",
      "admin_empresa_id",
      "rol_admin",
      "rol",
      "nombre_trabajador",
      "usuario_nombre",
      "obra",
      "nombre_proyecto",
      "cargo_trabajador",
      "admin_token",
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    navigate("/");
  }, [navigate]);

  return {
    rol,
    empresaId,
    logout,
  };
}
