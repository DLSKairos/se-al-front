import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../utils/api";

/**
 * useUsuarios — lista de usuarios de la empresa.
 */
export function useUsuarios(empresaId) {
  return useQuery({
    queryKey: ["usuarios", empresaId],
    queryFn: () =>
      api
        .get(`/admin_usuarios/listar?empresa_id=${empresaId}`)
        .then((r) => r.data),
    enabled: !!empresaId,
    staleTime: 30_000,
  });
}

/**
 * useToggleEstado — activa o desactiva un usuario (PATCH /admin_usuarios/estado/:id).
 */
export function useToggleEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.patch(`/admin_usuarios/estado/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

/**
 * useTogglePin — habilita o deshabilita el PIN de un usuario.
 */
export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.patch(`/admin_usuarios/pin/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

/**
 * useAgregarUsuario — crea un usuario nuevo en la empresa.
 */
export function useAgregarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post("/admin_usuarios/agregar", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}
