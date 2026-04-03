import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function toYMD(date) {
  if (!date) return '';
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizaFlag(val) {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "string") {
    if (val.toUpperCase() === "SI") return "Sí";
    if (val.toUpperCase() === "NO") return "No";
    if (val.toUpperCase() === "NA") return "N/A";
  }
  if (typeof val === "boolean") return val ? "Sí" : "No";
  return val;
}

function ChequeoAlturasAdmin() {
  const [activeBar, setActiveBar] = useState(""); // "ver", "excel", "pdf"
  const [filters, setFilters] = useState({
    nombre: "",
    cedula: "",
    obra: "",
    constructora: "",
    fecha_inicio: "",
    fecha_fin: "",
    limit: 50,
    offset: 0
  });
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [nombresOperarios, setNombresOperarios] = useState([]);
  const [listaObras, setListaObras] = useState([]);
  const [listaConstructoras, setListaConstructoras] = useState([]);
  const [openId, setOpenId] = useState(null);

  const handleOpenBar = (bar) => {
    setActiveBar(bar === activeBar ? "" : bar);
    setResultados([]);
    setTotal(0);
    setFilters(f => ({ ...f, offset: 0 }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  async function handleBuscar() {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || '',
        cedula: filters.cedula || '',
        obra: filters.obra || '',
        constructora: filters.constructora || '',
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };
      const res = await axios.post(`${API_BASE_URL}/chequeo_alturas_admin/buscar`, body);
      setResultados(res.data?.rows || []);
      setTotal(res.data?.count || 0);
    } catch (e) {
      setResultados([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function handleDescargar(tipo) {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || '',
        cedula: filters.cedula || '',
        obra: filters.obra || '',
        constructora: filters.constructora || '',
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        formato: tipo,
        limit: 50000
      };
      const res = await axios.post(`${API_BASE_URL}/chequeo_alturas_admin/descargar`, body, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: tipo === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', tipo === 'excel' ? 'chequeo_alturas.xlsx' : 'chequeo_alturas.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchNombres() {
      try {
        const res = await axios.get(`${API_BASE_URL}/datos_basicos`);
        if (Array.isArray(res.data.datos)) {
          setNombresOperarios(res.data.datos.filter(d => Number(d.empresa_id) === 1).map(d => d.nombre));
        } else {
          setNombresOperarios([]);
        }
      } catch (e) {
        setNombresOperarios([]);
      }
    }
    fetchNombres();

    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        const obras = res.data.obras || [];
        setListaObras(obras);
        const constructoras = Array.from(new Set(obras.map(o => o.constructora).filter(Boolean)));
        setListaConstructoras(constructoras);
      })
      .catch(() => {
        setListaObras([]);
        setListaConstructoras([]);
      });
  }, []);

  useEffect(() => {
    if (activeBar === "ver") {
      handleBuscar();
    }
    // eslint-disable-next-line
  }, [filters.offset, filters.limit]);

  const renderBarraBusqueda = (forAction) => (
    <div className="card-section" style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 10, fontWeight: 600, color: "#222", fontSize: 15 }}>
        Ingresa uno o más parámetros para filtrar los resultados:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Nombre</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="nombre"
            value={filters.nombre}
            onChange={handleFilterChange}
            placeholder="Buscar o selecciona nombre"
            style={{ width: "93%", marginBottom: 6 }}
            list="lista-nombres-operarios"
          />
          <datalist id="lista-nombres-operarios">
            {nombresOperarios.map((nombre, i) => (
              <option key={i} value={nombre} />
            ))}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Cédula</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="cedula"
            value={filters.cedula}
            onChange={handleFilterChange}
            placeholder="Cédula"
            style={{ width: "93%", marginBottom: 6 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Obra</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="obra"
            value={filters.obra}
            onChange={handleFilterChange}
            placeholder="Buscar o selecciona obra"
            style={{ width: "93%", marginBottom: 6 }}
            list="lista-obras"
          />
          <datalist id="lista-obras">
            {listaObras.map((obra) => (
              <option key={obra.id} value={obra.nombre_obra}></option>
            ))}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Constructora</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="constructora"
            value={filters.constructora}
            onChange={handleFilterChange}
            placeholder="Buscar o selecciona constructora"
            style={{ width: "93%", marginBottom: 6 }}
            list="lista-constructoras"
          />
          <datalist id="lista-constructoras">
            {listaConstructoras.map((c, i) => (
              <option key={i} value={c}></option>
            ))}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Rango de Fechas</label>
          <input
            className="permiso-trabajo-input"
            type="date"
            name="fecha_inicio"
            value={filters.fecha_inicio}
            onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <input
            className="permiso-trabajo-input"
            type="date"
            name="fecha_fin"
            value={filters.fecha_fin}
            onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }}
          />
        </div>
        {forAction === "ver" ? (
          <button className="permiso-trabajo-btn" onClick={handleBuscar} style={{ width: "100%", marginTop: 8 }}>
            Buscar
          </button>
        ) : (
          <>
            <button className="permiso-trabajo-btn" onClick={() => handleDescargar(forAction)} style={{ width: "100%", marginTop: 8 }}>
              Descargar
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="form-container">
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Chequeo Alturas - Administrador</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", marginBottom: 18 }}>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("ver")}
          >
            Ver
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("excel")}
          >
            Descargar en Excel
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("pdf")}
          >
            Descargar en PDF
          </button>
        </div>
        {activeBar && renderBarraBusqueda(activeBar)}
        {activeBar === "ver" && (
          <div className="card-section" style={{ marginTop: 12 }}>
            {loading ? (
              <p className="permiso-trabajo-label">Cargando datos...</p>
            ) : (
              <>
                <div style={{ marginBottom: 10, fontSize: 14, color: "#222" }}>
                  {total > 0 && (
                    <span>
                      Mostrando {filters.offset + 1} - {Math.min(filters.offset + (filters.limit || 50), total)} de {total} resultados
                    </span>
                  )}
                </div>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {resultados.length === 0 ? (
                    <p className="permiso-trabajo-label">No hay resultados disponibles.</p>
                  ) : (
                    resultados.map((r, idx) => (
                      <li
                        key={r.id || idx}
                        style={{
                          background: "#f7fbff",
                          marginBottom: 12,
                          padding: "10px 12px",
                          borderRadius: 8,
                          minWidth: 220,
                          maxWidth: 320,
                          fontSize: 14,
                          boxShadow: "0 1px 4px #e0e0e0",
                          marginLeft: "auto",
                          marginRight: "auto"
                        }}
                      >
                        <div><strong>Fecha:</strong> {r.fecha ? r.fecha.slice(0, 10) : "—"}</div>
                        <div><strong>Nombre:</strong> {r.nombre || "—"}</div>
                        <div><strong>Cédula:</strong> {r.cedula || r.numero_identificacion || "—"}</div>
                        <div><strong>Empresa:</strong> {r.empresa || "—"}</div>
                        <div><strong>Obra:</strong> {r.obra || "—"}</div>
                        <div><strong>Constructora:</strong> {r.constructora || "—"}</div>
                        <button
                          className="permiso-trabajo-btn"
                          style={{ marginTop: 8, fontSize: 13, padding: "4px 10px" }}
                          onClick={() => setOpenId(openId === (r.raw?.id || r.id || idx) ? null : (r.raw?.id || r.id || idx))}
                        >
                          {openId === (r.raw?.id || r.id || idx) ? "Ocultar detalles" : "Ver más"}
                        </button>
                        {openId === (r.raw?.id || r.id || idx) && r.raw && (
                          <div className="detalle" style={{
                            background: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: 8,
                            marginTop: 10,
                            padding: "10px 8px",
                            fontSize: 13,
                            color: "#222"
                          }}>
                            {Object.entries(r.raw).map(([key, val]) => (
                              <div key={key} style={{ marginBottom: 4 }}>
                                <strong>{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:</strong>{" "}
                                {typeof val === "string" && ["SI", "NO", "NA"].includes(val.toUpperCase())
                                  ? normalizaFlag(val)
                                  : (val === null || val === undefined || val === "") ? "—" : String(val)}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))
                  )}
                </ul>
                {total > (filters.limit || 50) && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
                    <button
                      className="permiso-trabajo-btn"
                      style={{ minWidth: 90 }}
                      disabled={loading || filters.offset === 0}
                      onClick={() => setFilters(f => ({ ...f, offset: Math.max(0, f.offset - (f.limit || 50)) }))}
                    >
                      Anterior
                    </button>
                    <button
                      className="permiso-trabajo-btn"
                      style={{ minWidth: 90 }}
                      disabled={loading || filters.offset + (filters.limit || 50) >= total}
                      onClick={() => setFilters(f => ({ ...f, offset: f.offset + (f.limit || 50) }))}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChequeoAlturasAdmin;
