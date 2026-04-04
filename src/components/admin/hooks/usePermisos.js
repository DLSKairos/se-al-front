import { useQuery } from "@tanstack/react-query";
import api from "../../../utils/api";

/**
 * usePermisos — lista paginada de permisos de trabajo con filtros.
 *
 * Parámetros:
 *   empresaId {number}
 *   search    {string}  — búsqueda libre de texto
 *   status    {string}  — "" | "aprobado" | "pendiente" | "rechazado"
 *   page      {number}  — página actual (base 1)
 *   limit     {number}  — resultados por página (default 20)
 */
export function usePermisos({
  empresaId,
  search = "",
  status = "",
  page = 1,
  limit = 20,
}) {
  return useQuery({
    queryKey: ["permisos", empresaId, search, status, page],
    queryFn: () =>
      api
        .post("/permiso_trabajo_admin/buscar", {
          empresa_id: empresaId,
          search,
          estado: status || undefined,
          page,
          limit,
        })
        .then((r) => r.data),
    enabled: !!empresaId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
