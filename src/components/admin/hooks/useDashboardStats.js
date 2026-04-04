import { useQuery } from "@tanstack/react-query";
import api from "../../../utils/api";

/**
 * Hook que obtiene las estadísticas del dashboard para una empresa dada.
 *
 * Mientras el endpoint /admin/dashboard no esté implementado en el backend,
 * placeholderData provee datos stub para que la UI no quede vacía.
 */
export function useDashboardStats(empresaId) {
  return useQuery({
    queryKey: ["dashboard", empresaId],
    queryFn: () =>
      api.get(`/admin/dashboard?empresa_id=${empresaId}`).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!empresaId,
    placeholderData: {
      totalUsers: 0,
      activeUsers: 0,
      totalPermisos: 0,
      aprobados: 0,
      pendientes: 0,
      rechazados: 0,
      monthlyTrend: [],
      byStatus: [
        { name: "Aprobados", value: 0 },
        { name: "Pendientes", value: 0 },
        { name: "Rechazados", value: 0 },
      ],
      byType: [],
      recentPermisos: [],
    },
  });
}
