import { useState, useEffect } from "react";
import api from "../utils/api";

/**
 * Hook que carga los datos generales del formulario desde localStorage y la API.
 *
 * Retorna un objeto con los campos ya resueltos:
 *   - nombre_proyecto  : obra activa del operador
 *   - nombre_operador  : nombre del trabajador autenticado
 *   - cargo            : cargo del trabajador
 *   - fechaHoy         : fecha actual en zona Colombia (YYYY-MM-DD)
 *   - constructora     : nombre del cliente/constructora obtenido de /obras
 *   - cargando         : true mientras la llamada a /obras está en progreso
 */
export function useFormGenerales() {
  const [generales, setGenerales] = useState({
    nombre_proyecto: "",
    nombre_operador: "",
    cargo: "",
    fechaHoy: "",
    constructora: "",
    cargando: true,
  });

  useEffect(() => {
    const nombre_proyecto =
      localStorage.getItem("obra") ||
      localStorage.getItem("nombre_proyecto") ||
      "";
    const nombre_operador =
      localStorage.getItem("nombre_trabajador") ||
      localStorage.getItem("usuario_nombre") ||
      "";
    const cargo = localStorage.getItem("cargo_trabajador") || "";
    const fechaHoy = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Bogota",
    });

    api
      .get("/obras")
      .then((res) => {
        const obras = Array.isArray(res.data.obras) ? res.data.obras : [];
        const obraSeleccionada = obras.find(
          (o) => (o.nombre_obra || o.nombre || "") === nombre_proyecto
        );
        const constructora = obraSeleccionada
          ? obraSeleccionada.constructora || obraSeleccionada.empresa || ""
          : "";
        setGenerales({
          nombre_proyecto,
          nombre_operador,
          cargo,
          fechaHoy,
          constructora,
          cargando: false,
        });
      })
      .catch(() => {
        setGenerales({
          nombre_proyecto,
          nombre_operador,
          cargo,
          fechaHoy,
          constructora: "",
          cargando: false,
        });
      });
  }, []);

  return generales;
}
