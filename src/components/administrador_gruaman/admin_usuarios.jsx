import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

const roles = [
  { id: 1, nombre: "Gruaman" },
  { id: 2, nombre: "Bomberman" },
  { id: 3, nombre: "Técnico" },
  { id: 4, nombre: "SST" }
];

function AdminUsuarios() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    rol: roles[0].id,
    numero_identificacion: "",
    activo: true
  });
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    async function fetchTrabajadores() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/admin_usuarios/listar`, {
          params: {
            empresa_id: 1,
            offset,
            limit,
            busqueda
          }
        });
        setTrabajadores(res.data.trabajadores || []);
        setTotal(res.data.total || 0);
      } catch (e) {
        setTrabajadores([]);
        setTotal(0);
      }
      setLoading(false);
    }
    fetchTrabajadores();
    // eslint-disable-next-line
  }, [busqueda, offset]);

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
    setOffset(0);
  };

  const handleAgregar = async (e) => {
    e.preventDefault();
    setAgregando(true);
    try {
      const nombreFormateado = capitalizeWords(nuevo.nombre.trim());
      const numero_identificacion = nuevo.numero_identificacion.replace(/[.,]/g, "");
      await axios.post(`${API_BASE_URL}/admin_usuarios/agregar`, {
        nombre: nombreFormateado,
        empresa_id: 1,
        numero_identificacion,
        activo: true
      });
      setShowModal(false);
      setNuevo({ nombre: "", rol: roles[0].id, numero_identificacion: "", activo: true });
      setOffset(0);
      setBusqueda(""); // recargar lista
    } catch (e) {
      alert("Error al agregar trabajador");
    }
    setAgregando(false);
  };

  const handleToggleActivo = async (id, actual) => {
    setLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/admin_usuarios/estado/${id}`, {
        activo: !actual
      });
      setTrabajadores(trabajadores =>
        trabajadores.map(t => t.id === id ? { ...t, activo: !actual } : t)
      );
    } catch (e) {
      alert("Error al cambiar estado");
    }
    setLoading(false);
  };

  const handleTogglePin = async (id, actual) => {
    try {
      await axios.patch(`${API_BASE_URL}/admin_usuarios/pin/${id}`, {
        pin_habilitado: !actual
      });
      setTrabajadores(trabajadores =>
        trabajadores.map(t => t.id === id ? { ...t, pin_habilitado: !actual } : t)
      );
    } catch (e) {
      alert("Error al cambiar PIN");
    }
  };

  return (
    <div className="form-container">
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Administrar Usuarios</h3>
        <div className="card-section" style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, color: "#222", fontSize: 15, marginBottom: 8 }}>
            Buscar trabajador por nombre:
          </label>
          <input
            className="permiso-trabajo-input"
            type="text"
            value={busqueda}
            onChange={handleBusqueda}
            placeholder="Ejemplo: Juan"
            style={{ width: "96%", marginBottom: 6 }}
          />
        </div>
        {loading ? (
          <p className="permiso-trabajo-label">Cargando datos...</p>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {trabajadores.length === 0 ? (
                <p className="permiso-trabajo-label">No hay trabajadores disponibles.</p>
              ) : (
                trabajadores.map((t, idx) => (
                  <li
                    key={t.id || idx}
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.28)",
                      marginBottom: 12,
                      padding: "10px 12px",
                      borderRadius: 16,
                      minWidth: 220,
                      maxWidth: 320,
                      fontSize: 15,
                      boxShadow: "0 2px 12px rgba(30,64,175,0.10)",
                      marginLeft: "auto",
                      marginRight: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{ flex: 1, marginRight: 8, minWidth: 0 }}>
                      <span style={{ fontWeight: 500, color: "#222", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.nombre}</span>
                      <span style={{ fontSize: 12, color: "#757575" }}>{t.numero_identificacion}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      {/* Toggle activo/inactivo */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: t.activo ? "#43a047" : "#e53935" }}>
                          {t.activo ? "Activo" : "Inactivo"}
                        </span>
                        <span
                          style={{
                            display: "inline-block", width: 36, height: 20, borderRadius: 12,
                            background: t.activo ? "#43a047" : "#e53935",
                            position: "relative", transition: "background 0.2s", cursor: "pointer"
                          }}
                          onClick={() => handleToggleActivo(t.id, t.activo)}
                        >
                          <span style={{
                            position: "absolute", left: t.activo ? 18 : 2, top: 2,
                            width: 16, height: 16, borderRadius: "50%",
                            background: "#fff", boxShadow: "0 1px 4px #bdbdbd", transition: "left 0.2s"
                          }} />
                        </span>
                      </div>
                      {/* Toggle PIN */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: t.pin_habilitado ? "#1976d2" : "#9e9e9e" }}>
                          PIN
                        </span>
                        <span
                          style={{
                            display: "inline-block", width: 36, height: 20, borderRadius: 12,
                            background: t.pin_habilitado ? "#1976d2" : "#9e9e9e",
                            position: "relative", transition: "background 0.2s", cursor: "pointer"
                          }}
                          onClick={() => handleTogglePin(t.id, !!t.pin_habilitado)}
                        >
                          <span style={{
                            position: "absolute", left: t.pin_habilitado ? 18 : 2, top: 2,
                            width: 16, height: 16, borderRadius: "50%",
                            background: "#fff", boxShadow: "0 1px 4px #bdbdbd", transition: "left 0.2s"
                          }} />
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
              <button
                className="permiso-trabajo-btn"
                style={{ minWidth: 48, fontSize: 18, padding: "4px 0" }}
                disabled={loading || offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                aria-label="Anterior"
              >
                &#8592;
              </button>
              <button
                className="permiso-trabajo-btn"
                style={{ minWidth: 48, fontSize: 18, padding: "4px 0" }}
                disabled={loading || offset + limit >= total}
                onClick={() => setOffset(offset + limit)}
                aria-label="Siguiente"
              >
                &#8594;
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: "#666", textAlign: "center" }}>
              Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total} trabajadores
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <button
                className="permiso-trabajo-btn"
                style={{ minWidth: 160, fontWeight: 600 }}
                onClick={() => setShowModal(true)}
              >
                Agregar trabajador
              </button>
            </div>
            {showModal && (
              <div
                style={{
                  position: "fixed",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "rgba(30,64,175,0.10)",
                  backdropFilter: "blur(2px)",
                  WebkitBackdropFilter: "blur(2px)",
                  zIndex: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onClick={() => !agregando && setShowModal(false)}
              >
                <form
                  className="card-section"
                  style={{
                    minWidth: 320,
                    maxWidth: 380,
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: 18,
                    boxShadow: "0 4px 24px rgba(30,64,175,0.12)",
                    padding: 24,
                    position: "relative",
                    border: "1.5px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    overflow: "hidden"
                  }}
                  onClick={e => e.stopPropagation()}
                  onSubmit={handleAgregar}
                >
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: "linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(30,64,175,0.04) 100%)"
                  }} />
                  <h4 style={{ marginBottom: 18, fontWeight: 700, color: "#222", position: "relative", zIndex: 1 }}>Agregar trabajador</h4>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Nombre completo</label>
                    <input
                      className="permiso-trabajo-input"
                      type="text"
                      value={nuevo.nombre}
                      onChange={e => setNuevo(n => ({ ...n, nombre: e.target.value }))}
                      placeholder="Ejemplo: Juan Perez"
                      style={{ width: "98%", marginTop: 4 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Rol</label>
                    <select
                      className="permiso-trabajo-input"
                      value={nuevo.rol}
                      onChange={e => setNuevo(n => ({ ...n, rol: Number(e.target.value) }))}
                      style={{ width: "98%", marginTop: 4 }}
                      required
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Número de identificación</label>
                    <input
                      className="permiso-trabajo-input"
                      type="text"
                      value={nuevo.numero_identificacion}
                      onChange={e => setNuevo(n => ({
                        ...n,
                        numero_identificacion: e.target.value.replace(/[.,]/g, "")
                      }))}
                      placeholder="Ejemplo: 123456789"
                      style={{ width: "98%", marginTop: 4 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 18, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Estado</label>
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 36,
                          height: 20,
                          borderRadius: 12,
                          background: "#43a047",
                          position: "relative",
                          verticalAlign: "middle"
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 18,
                            top: 2,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 1px 4px #bdbdbd"
                          }}
                        />
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#43a047", marginLeft: 8 }}>
                        Activo
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, position: "relative", zIndex: 1 }}>
                    <button
                      type="button"
                      className="permiso-trabajo-btn"
                      style={{ background: "#bdbdbd", color: "#fff", minWidth: 90 }}
                      onClick={() => !agregando && setShowModal(false)}
                      disabled={agregando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="permiso-trabajo-btn"
                      style={{ minWidth: 90 }}
                      disabled={agregando}
                    >
                      {agregando ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </div>
            )}
            </>
        )}
      </div>
    </div>
  );
}

export default AdminUsuarios;
