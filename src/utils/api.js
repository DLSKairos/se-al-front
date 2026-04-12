/**
 * api.js — instancia central de Axios para el proyecto.
 *
 * La URL base se lee de la variable de entorno VITE_API_BASE_URL; si no está
 * definida, se usa el entorno de producción en Render como valor por defecto.
 *
 * Todos los módulos deben importar esta instancia en lugar de crear instancias
 * propias de Axios para garantizar una configuración uniforme.
 */
import axios from "axios";

/** URL base de la API, configurable mediante la variable de entorno VITE_API_BASE_URL. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/** Instancia preconfigurada de Axios lista para ser importada por cualquier módulo. */
const api = axios.create({ baseURL: API_BASE_URL });

export default api;
