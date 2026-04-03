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

const EMPRESAS = [
  { id: 1, label: "Gruaman" },
  { id: 3, label: "Tecnicos" },
  { id: 4, label: "SST" }
];

function horasExtraGruaman() {
  const [activeBar, setActiveBar] = useState("");
  const [filters, setFilters] = useState({
    nombre: "",
    cedula: "",
    obra: "",
    constructora: "",
    empresa_id: 1,
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
  const [resumenPorMes, setResumenPorMes] = useState([]);
  const [periodo, setPeriodo] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleOpenBar = (bar) => {
    setActiveBar(bar === activeBar ? "" : bar);
    setResultados([]);
    setTotal(0);
    setResumenPorMes([]);
    setPeriodo({});
    setOpenId(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = async (resetOffset = false) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const empresaId = Number(filters.empresa_id) || 1;
      const body = {
        nombre: filters.nombre || "",
        obra: filters.obra || "",
        constructora: filters.constructora || "",
        empresa_id: empresaId,
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        limit: filters.limit || 20,
        offset: resetOffset ? 0 : (filters.offset || 0)
      };
      let data = {};
      let adminError = null;
      try {
        const res = await axios.post(`${API_BASE_URL}/administrador/admin_horas_extra/buscar`, body, {
          headers: { "Content-Type": "application/json" }
        });
        data = res.data || {};
        const filteredRows = Array.isArray(data.rows)
          ? data.rows.filter(r => (Number(r.empresa_id) === empresaId || (r.raw && Number(r.raw.empresa_id) === empresaId)))
          : [];
        setResultados(filteredRows);
        setTotal(filteredRows.length);
        setHasSearched(true);
        try {
          const resSum = await axios.post(`${API_BASE_URL}/administrador/admin_horas_extra/resumen`, body, {
            headers: { "Content-Type": "application/json" }
          });
          setResumenPorMes(resSum.data?.resumen_por_mes || []);
          setPeriodo(resSum.data?.periodo || {});
        } catch (e) {
          setResumenPorMes([]);
          setPeriodo({});
        }
      } catch (err) {
        adminError = err;
      }
      if (adminError) {
        setErrorMessage(adminError?.response?.data?.error || "Error al realizar la búsqueda.");
        setResultados([]);
        setResumenPorMes([]);
        setPeriodo({});
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async (tipo) => {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || "",
        obra: filters.obra || "",
        constructora: filters.constructora || "",
        empresa_id: Number(filters.empresa_id) || 1,
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        formato: tipo,
        limit: tipo === "excel" ? 10000 : (filters.limit || 10000)
      };

      const url = `${API_BASE_URL}/administrador/admin_horas_extra/descargar`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`Error descarga: ${resp.status}`);
      const buffer = await resp.arrayBuffer();
      let mime = "application/octet-stream";
      let filename = "archivo";
      if (tipo === "excel") {
        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = "horas_jornada.xlsx";
      } else if (tipo === "pdf") {
        mime = "application/zip";
        filename = "horas_jornada.zip";
      }
      const blob = new Blob([buffer], { type: mime });
      const link = document.createElement("a");
      const blobUrl = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const empresaId = Number(filters.empresa_id) || 1;

    async function fetchNombres() {
      try {
        const res = await axios.get(`${API_BASE_URL}/datos_basicos`);
        if (Array.isArray(res.data.datos)) {
          const datosEmpresa = res.data.datos.filter(d => Number(d.empresa_id) === empresaId);
          setNombresOperarios(datosEmpresa.map(d => d.nombre));
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
        const obrasAll = res.data.obras || [];
        const obras = obrasAll.filter(o => Number(o.empresa_id) === empresaId);
        setListaObras(obras);
        const constructoras = Array.from(new Set(obras.map(o => o.constructora).filter(Boolean)));
        setListaConstructoras(constructoras);
      })
      .catch(() => {
        setListaObras([]);
        setListaConstructoras([]);
      });
  }, [filters.empresa_id]);

  useEffect(() => {
    if (activeBar === "ver" && hasSearched) {
      handleBuscar(false);
    }
    // eslint-disable-next-line
  }, [filters.offset, filters.limit, hasSearched]);

  const renderBarraBusqueda = (forAction) => (
    <div className="card-section" style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 10, fontWeight: 600, color: "#222", fontSize: 15 }}>
        Ingresa uno o más parámetros para filtrar los resultados:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Cargo</label>
          <select
            className="permiso-trabajo-input"
            name="empresa_id"
            value={filters.empresa_id}
            onChange={(e) => {
              const newEmpresaId = Number(e.target.value);
              setResultados([]);
              setTotal(0);
              setResumenPorMes([]);
              setPeriodo({});
              setHasSearched(false);
              setOpenId(null);
              setFilters(prev => ({
                ...prev,
                empresa_id: newEmpresaId,
                nombre: "",
                obra: "",
                constructora: "",
                offset: 0
              }));
            }}
            style={{ width: "93%", marginBottom: 6 }}
          >
            {EMPRESAS.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.label}</option>
            ))}
          </select>
        </div>
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
          <button className="permiso-trabajo-btn" onClick={() => handleBuscar(true)} style={{ width: "100%", marginTop: 8 }}>
            Buscar
          </button>
        ) : (
          <button className="permiso-trabajo-btn" onClick={() => handleDescargar(forAction)} style={{ width: "100%", marginTop: 8 }}>
            Descargar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="form-container">
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Horas Extra</h3>
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
                {errorMessage && (
                  <div style={{ marginBottom: 10, color: "crimson", fontSize: 13 }}>{errorMessage}</div>
                )}
                
                <div style={{ marginBottom: 10, fontSize: 14, color: "#222" }}>
                  {total > 0 && (
                    <span>
                      Mostrando {(filters.offset || 0) + 1} - {Math.min((filters.offset || 0) + (filters.limit || 50), total)} de {total} resultados
                    </span>
                  )}
                </div>

                {/* Período consultado */}
                {periodo && (periodo.fecha_inicio || periodo.fecha_fin) && (
                  <div style={{
                    background: "#e3f2fd",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 12,
                    fontSize: 13,
                    color: "#1565c0",
                    border: "1px solid #bbdefb"
                  }}>
                    📅 <strong>Período:</strong> {periodo.fecha_inicio || "—"} al {periodo.fecha_fin || "—"}
                  </div>
                )}

                {/* Resumen por Mes */}
                {resumenPorMes && resumenPorMes.length > 0 && resumenPorMes.map((mesData, mesIdx) => (
                  <div key={mesIdx} style={{
                    background: "#fff3e0",
                    borderRadius: 8,
                    padding: "12px 16px",
                    marginBottom: 16,
                    border: "1px solid #ffe0b2"
                  }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#e65100" }}>📆 {mesData.mes_nombre}</h4>
                    
                    {/* Totales del mes */}
                    <div style={{
                      background: "#e8f5e9",
                      borderRadius: 6,
                      padding: "8px 12px",
                      marginBottom: 12,
                      border: "1px solid #c8e6c9"
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                        <div><strong>Horas Trabajadas:</strong> {mesData.totales?.total_horas_trabajadas || 0}</div>
                        <div><strong>Total Extras:</strong> {mesData.totales?.total_horas_extras || 0}</div>
                        <div><strong>Extra Diurna:</strong> {mesData.totales?.total_extra_diurna || 0}</div>
                        <div><strong>Extra Nocturna:</strong> {mesData.totales?.total_extra_nocturna || 0}</div>
                        <div><strong>Extra Festiva:</strong> {mesData.totales?.total_extra_festiva || 0}</div>
                      </div>
                    </div>

                    {/* Tabla de usuarios del mes */}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#ffe0b2" }}>
                            <th style={{ padding: "6px 8px", textAlign: "left" }}>Nombre</th>
                            <th style={{ padding: "6px 8px", textAlign: "center" }}>Días</th>
                            <th style={{ padding: "6px 8px", textAlign: "center" }}>Horas</th>
                            <th style={{ padding: "6px 8px", textAlign: "center" }}>Extra D</th>
                            <th style={{ padding: "6px 8px", textAlign: "center" }}>Extra N</th>
                            <th style={{ padding: "6px 8px", textAlign: "center" }}>Extra F</th>
                            <th style={{ padding: "6px 8px", textAlign: "center" }}>Total Extra</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mesData.resumen_usuarios && mesData.resumen_usuarios.map((u, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #ffe0b2" }}>
                              <td style={{ padding: "6px 8px" }}>{u.nombre_operador}</td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>{u.total_dias_trabajados}</td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>{u.total_horas_trabajadas}</td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>{u.total_extra_diurna}</td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>{u.total_extra_nocturna}</td>
                              <td style={{ padding: "6px 8px", textAlign: "center" }}>{u.total_extra_festiva}</td>
                              <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600 }}>{u.total_horas_extras}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Lista de registros individuales */}
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
                        <div><strong>Fecha:</strong> {(r.fecha_servicio || r.fecha) ? String(r.fecha_servicio || r.fecha).slice(0, 10) : "—"}</div>
                        <div><strong>Nombre:</strong> {r.nombre_operador || r.nombre || "—"}</div>
                        <div><strong>Cédula:</strong> {r.numero_identificacion || r.cedula || "—"}</div>
                        <div><strong>Obra:</strong> {r.nombre_proyecto || r.obra || "—"}</div>
                        <div><strong>Constructora:</strong> {r.nombre_cliente || r.constructora || "—"}</div>

                        <button
                          className="permiso-trabajo-btn"
                          style={{ marginTop: 8, fontSize: 13, padding: "4px 10px" }}
                          onClick={() => setOpenId(openId === (r.raw?.id || r.id || idx) ? null : (r.raw?.id || r.id || idx))}
                        >
                          {openId === (r.raw?.id || r.id || idx) ? "Ocultar detalles" : "Ver más"}
                        </button>

                        {openId === (r.raw?.id || r.id || idx) && (r.raw || r) && (
                          <div className="detalle" style={{
                            background: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: 8,
                            marginTop: 10,
                            padding: "10px 8px",
                            fontSize: 13,
                            color: "#222"
                          }}>
                            {Object.entries(r.raw || r).map(([key, val]) => (
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

export default horasExtraGruaman;