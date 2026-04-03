import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminObrasBomberman from "./admin_obras_bomberman";
import HorasExtraGruamanAdmin from "../administrador_gruaman/horas_extra_gruaman"; // Importa el componente de horas extra gruaman
import RegistrosDiariosAdmin from "../administrador/RegistrosDiariosAdmin";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function AdministradorBomberman() {
  const navigate = useNavigate();

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Administrador Bomberman
        </h3>
        <p className="label" style={{ marginBottom: 32 }}>
          Selecciona que deseas administrar:
        </p>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8
        }}>
         
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/permiso_trabajo_admin")}
          >
            Permiso de Trabajo
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/chequeo_alturas_admin")}
          >
            Chequeo Alturas
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/admin_usuarios_bomberman")}
          >
            Administrar Usuarios
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/admin_obras_bomberman")}
          >
            Administrar Obras
          </button>
          {/* Nuevos botones admin */}
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/planilla_bombeo_admin")}
          >
            Planilla Bombeo
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/inventarios_obra_admin")}
          >
            Inventarios Obra
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/checklist_admin")}
          >
            Checklist
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/inspeccion_epcc_bomberman_admin")}
          >
            Inspección EPCC
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/herramientas_mantenimiento_admin")}
          >
            Herramientas de Mantenimiento
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/kit_limpieza_admin")}
          >
            Kit de Lavado y Mantenimiento
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/horas_extra_bomberman")}
          >
            Horas Extra Bomberman
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/registros_diarios_admin")}
          >
            Registros Diarios
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdministradorBomberman;
