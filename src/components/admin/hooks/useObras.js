import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../utils/api";

/**
 * useObras — lista de obras de la empresa.
 */
export function useObras(empresaId) {
  return useQuery({
    queryKey: ["obras", empresaId],
    queryFn: () =>
      api
        .get(`/admin_obras/listar?empresa_id=${empresaId}`)
        .then((r) => r.data),
    enabled: !!empresaId,
    staleTime: 60_000,
  });
}

/**
 * useToggleObra — activa o desactiva una obra.
 */
export function useToggleObra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.patch(`/admin_obras/estado/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obras"] }),
  });
}

/**
 * useAgregarObra — crea una obra nueva en la empresa.
 */
export function useAgregarObra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post("/admin_obras/agregar", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obras"] }),
  });
}
