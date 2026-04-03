import React, { useEffect, useState } from "react";
import axios from "axios";
import PermisoTrabajoAdmin from "./permiso_trabajo_admin";
import ChequeoAlturasAdmin from "./chequeo_alturas_admin";
import ChequeoTorreGruasAdmin from "./chequeo_torregruas_admin";
import ChequeoElevadorAdmin from "./chequeo_elevador_admin";
import AdminsObras from "./admins_obras";
import HorasExtraGruamanAdmin from "./horas_extra_gruaman";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * AdministradorGruaman — panel de administración para Gruaman.
 * Punto de entrada para revisar registros diarios y gestionar obras/horas extras.
 * Los subpaneles (permiso_trabajo, chequeo_alturas, etc.) se alternan en la misma vista.
 */
function AdministradorGruaman() {
  const [registros, set_registros] = useState([]);
  const [loading, set_loading] = useState(true);
  const [showPermisoTrabajoAdmin, setShowPermisoTrabajoAdmin] = useState(false);
  const [showChequeoAlturasAdmin, setShowChequeoAlturasAdmin] = useState(false);
  const [showChequeoTorreGruasAdmin, setShowChequeoTorreGruasAdmin] = useState(false);
  const [showChequeoElevadorAdmin, setShowChequeoElevadorAdmin] = useState(false);
  const api_url = "http://localhost:3000";
  const navigate = useNavigate();


  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Administrador Gruaman
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
            onClick={() => navigate("/chequeo_torregruas_admin")}
          >
            Chequeo Torre Grúa
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/chequeo_elevador_admin")}
          >
            Chequeo Elevador
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/inspeccion_EPCC_admins")}
          >
            Inspección EPCC
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/inspeccion_izaje_admin")}
          >
            Inspección Izaje
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/admin_usuarios")}
          >
            Administrar Usuarios
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/admins_obras")}
          >
            Administrar Obras
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/horas_extra_gruaman")}
          >
            Horas Extra Gruaman
          </button>
        </div>
        {showPermisoTrabajoAdmin && (
          <div style={{ marginTop: 24 }}>
            <PermisoTrabajoAdmin />
          </div>
        )}
        {showChequeoAlturasAdmin && (
          <div style={{ marginTop: 24 }}>
            <ChequeoAlturasAdmin />
          </div>
        )}
        {showChequeoTorreGruasAdmin && (
          <div style={{ marginTop: 24 }}>
            <ChequeoTorreGruasAdmin />
          </div>
        )}
        {showChequeoElevadorAdmin && (
          <div style={{ marginTop: 24 }}>
            <ChequeoElevadorAdmin />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdministradorGruaman;
