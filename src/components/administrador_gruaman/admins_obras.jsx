import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function AdminObrasBomberman() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre_obra: "",
    constructora: "",
    direccion: "",
    ciudad: "",
    activa: true
  });
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    async function fetchObras() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/admin_obras/listar`, {
          params: {
            empresa_id: 1,
            offset,
            limit,
            busqueda
          }
        });
        setObras(res.data.obras || []);
        setTotal(res.data.total || 0);
      } catch (e) {
        setObras([]);
        setTotal(0);
      }
      setLoading(false);
    }
    fetchObras();
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
      const nombreObraFormateado = capitalizeWords(nuevo.nombre_obra.trim());
      const constructoraFormateada = capitalizeWords(nuevo.constructora.trim());
      const ciudadFormateada = capitalizeWords(nuevo.ciudad.trim());
      await axios.post(`${API_BASE_URL}/admin_obras/agregar`, {
        nombre_obra: nombreObraFormateado,
        empresa_id: 1,
        constructora: constructoraFormateada,
        direccion: nuevo.direccion.trim(),
        ciudad: ciudadFormateada,
        activa: true
      });
      setShowModal(false);
      setNuevo({
        nombre_obra: "",
        constructora: "",
        direccion: "",
        ciudad: "",
        activa: true
      });
      setOffset(0);
      setBusqueda("");
    } catch (e) {
      alert("Error al agregar obra");
    }
    setAgregando(false);
  };

  const handleToggleActiva = async (id, actual) => {
    setLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/admin_obras/estado/${id}`, {
        activa: !actual
      });
      setObras(obras =>
        obras.map(o => o.id === id ? { ...o, activa: !actual } : o)
      );
    } catch (e) {
      alert("Error al cambiar estado");
    }
    setLoading(false);
  };

  return (
    <div className="form-container">
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Administrar Obras Bomberman</h3>
        <div className="card-section" style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, color: "#222", fontSize: 15, marginBottom: 8 }}>
            Buscar obra por nombre:
          </label>
          <input
            className="permiso-trabajo-input"
            type="text"
            value={busqueda}
            onChange={handleBusqueda}
            placeholder="Ejemplo: La Pepita"
            style={{ width: "96%", marginBottom: 6 }}
          />
        </div>
        {loading ? (
          <p className="permiso-trabajo-label">Cargando datos...</p>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {obras.length === 0 ? (
                <p className="permiso-trabajo-label">No hay obras disponibles.</p>
              ) : (
                obras.map((o, idx) => (
                  <li
                    key={o.id || idx}
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
                    <span style={{ fontWeight: 500, color: "#222" }}>{o.nombre_obra}</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 36,
                          height: 20,
                          borderRadius: 12,
                          background: o.activa === true ? "#43a047" : "#e53935",
                          position: "relative",
                          transition: "background 0.2s",
                          cursor: "pointer"
                        }}
                        onClick={() => handleToggleActiva(o.id, o.activa)}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: o.activa === true ? 18 : 2,
                            top: 2,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 1px 4px #bdbdbd",
                            transition: "left 0.2s"
                          }}
                        />
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: o.activa === true ? "#43a047" : "#e53935" }}>
                        {o.activa === true ? "Activo" : "Inactivo"}
                      </span>
                    </label>
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
              Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total} obras
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <button
                className="permiso-trabajo-btn"
                style={{ minWidth: 160, fontWeight: 600 }}
                onClick={() => setShowModal(true)}
              >
                Agregar obra
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
                  <h4 style={{ marginBottom: 18, fontWeight: 700, color: "#222", position: "relative", zIndex: 1 }}>Agregar obra</h4>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Nombre completo</label>
                    <input
                      className="permiso-trabajo-input"
                      type="text"
                      value={nuevo.nombre_obra}
                      onChange={e => setNuevo(n => ({ ...n, nombre_obra: e.target.value }))}
                      placeholder="Ejemplo: La Pepita"
                      style={{ width: "98%", marginTop: 4 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Constructora</label>
                    <input
                      className="permiso-trabajo-input"
                      type="text"
                      value={nuevo.constructora}
                      onChange={e => setNuevo(n => ({ ...n, constructora: e.target.value }))}
                      placeholder="Ejemplo: Constructora Bolivar"
                      style={{ width: "98%", marginTop: 4 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Dirección</label>
                    <input
                      className="permiso-trabajo-input"
                      type="text"
                      value={nuevo.direccion}
                      onChange={e => setNuevo(n => ({ ...n, direccion: e.target.value }))}
                      placeholder="Ejemplo: Calle 123 #45-67"
                      style={{ width: "98%", marginTop: 4 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#222" }}>Ciudad</label>
                    <input
                      className="permiso-trabajo-input"
                      type="text"
                      value={nuevo.ciudad}
                      onChange={e => setNuevo(n => ({ ...n, ciudad: e.target.value }))}
                      placeholder="Ejemplo: Bogotá"
                      style={{ width: "98%", marginTop: 4 }}
                      required
                    />
                  </div>
                  {/* Municipio eliminado */}
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

export default AdminObrasBomberman;
