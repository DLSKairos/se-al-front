import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook que expone el rol del administrador autenticado y la función de logout.
 *
 * Soporta tanto la clave "admin_rol" (nuevo panel /admin) como las claves
 * legadas "rol_admin" y "rol" para no romper el flujo antiguo.
 *
 * Valores esperados: "gruaman" | "bomberman"
 */
export function useAdminRole() {
  const navigate = useNavigate();

  const rol = (
    localStorage.getItem("admin_rol") ||
    localStorage.getItem("rol_admin") ||
    localStorage.getItem("rol") ||
    ""
  ).toLowerCase();

  const empresaId = rol === "gruaman" ? 1 : rol === "bomberman" ? 2 : null;

  const logout = useCallback(() => {
    const keysToRemove = [
      "admin_rol",
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
    isGruaman: rol === "gruaman",
    isBomberman: rol === "bomberman",
    logout,
  };
}
