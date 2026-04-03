import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Normaliza un valor de fecha a una cadena YYYY-MM-DD.
 * Las cadenas ya en ese formato se retornan sin cambios para evitar desfases UTC.
 * @param {string|Date} date
 * @returns {string}
 */
function toYMD(date) {
  if (!date) return '';
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * RegistrosDiariosAdmin — visor y descargador de registros diarios multi-empresa.
 * Busca trabajadores en todas las empresas e inicia descargas de Excel/PDF como blobs
 * a través de los endpoints de reportes del backend.
 */
function RegistrosDiariosAdmin() {
  const [activeBar, setActiveBar] = useState("");
  const [filters, setFilters] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    limit: 50,
    offset: 0
  });
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [nombresTrabajadores, setNombresTrabajadores] = useState([]);

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
        fecha_inicio: toYMD(filters.fecha_inicio) || '',
        fecha_fin: toYMD(filters.fecha_fin) || '',
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

      
      const res = await axios.post(`${API_BASE_URL}/api/buscar`, body);
      
      
      setResultados(res.data?.rows || []);
      setTotal(res.data?.count || 0);
    } catch (e) {
      setResultados([]);
      setTotal(0);
      if (e.response?.status === 404) {
        alert('Trabajador no encontrado en la base de datos');
      } else if (e.response?.status === 400) {
        alert(`Error: ${e.response?.data?.error || 'Parámetros inválidos'}`);
      } else {
        alert(`Error: ${e.response?.data?.error || e.message || 'Error al buscar registros'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDescargar() {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || '',
        fecha_inicio: toYMD(filters.fecha_inicio) || '',
        fecha_fin: toYMD(filters.fecha_fin) || '',
        limit: 50000
      };
      
      
      const res = await axios.post(
        `${API_BASE_URL}/api/descargar`,
        body,
        { 
          responseType: 'arraybuffer'
        }
      );


      const contentType = res.headers['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        const text = new TextDecoder().decode(res.data);
        const errorData = JSON.parse(text);
        alert(`Error del servidor: ${errorData.message || errorData.error || 'Error desconocido'}`);
        return;
      }

      let filename = 'registros_diarios.xlsx';
      
      const disposition = res.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }


      const blob = new Blob([res.data], { 
        type: contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (e) {
      if (e.response) {
        
        if (e.response.data) {
          try {
            const text = new TextDecoder().decode(e.response.data);
          } catch (decodeError) {
          }
        }
      }
      
      if (e.response?.status === 404) {
        alert('No se encontraron registros para los parámetros proporcionados');
      } else if (e.response?.status === 400) {
        alert('Error: Parámetros inválidos. Revisa las fechas ingresadas.');
      } else {
        alert(`Error al descargar: ${e.message || 'Error interno del servidor'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchNombres() {
      try {
        const res = await axios.get(`${API_BASE_URL}/datos_basicos`);
        if (Array.isArray(res.data.datos)) {
          const nombres = res.data.datos.map(t => t.nombre).filter(Boolean);
          setNombresTrabajadores([...new Set(nombres)].sort());
        } else {
          setNombresTrabajadores([]);
        }
      } catch (e) {
        setNombresTrabajadores([]);
      }
    }
    fetchNombres();
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
        Ingresa los parámetros para filtrar los resultados:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>
            Nombre del Trabajador (opcional)
          </label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="nombre"
            value={filters.nombre}
            onChange={handleFilterChange}
            placeholder="Buscar o selecciona nombre"
            style={{ width: "93%", marginBottom: 6 }}
            list="lista-nombres-trabajadores"
            disabled={loading}
          />
          <datalist id="lista-nombres-trabajadores">
            {nombresTrabajadores.map((nombre, i) => (
              <option key={i} value={nombre} />
            ))}
          </datalist>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>
            Rango de Fechas (opcional)
          </label>
          <input
            className="permiso-trabajo-input"
            type="date"
            name="fecha_inicio"
            value={filters.fecha_inicio}
            onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }}
            disabled={loading}
            placeholder="Fecha inicio"
          />
          <input
            className="permiso-trabajo-input"
            type="date"
            name="fecha_fin"
            value={filters.fecha_fin}
            onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }}
            disabled={loading}
            placeholder="Fecha fin"
          />
          <p style={{ fontSize: 11, color: "#666", margin: "4px 0 0 0" }}>
            Si no se especifican fechas, se usará hasta hoy
          </p>
        </div>

        {forAction === "ver" ? (
          <button 
            className="permiso-trabajo-btn" 
            onClick={handleBuscar} 
            style={{ width: "100%", marginTop: 8 }} 
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        ) : (
          <button 
            className="permiso-trabajo-btn" 
            onClick={handleDescargar} 
            style={{ width: "100%", marginTop: 8 }} 
            disabled={loading}
          >
            {loading ? 'Descargando...' : 'Descargar'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="form-container">
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Registros Diarios - Administrador</h3>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" }}>
          Consulta y descarga el historial de registros completados por trabajador
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", marginBottom: 18 }}>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("ver")}
            disabled={loading}
          >
            Ver Registros
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("excel")}
            disabled={loading}
          >
            Descargar en Excel
          </button>
        </div>

        {activeBar && renderBarraBusqueda(activeBar)}

        {activeBar === "ver" && (
          <div className="card-section" style={{ marginTop: 12 }}>
            {loading ? (
              <p className="permiso-trabajo-label">Cargando datos...</p>
            ) : (
              <>
                {resultados.length > 0 && (
                  <div style={{ marginBottom: 10, fontSize: 14, color: "#222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span>
                        Mostrando {filters.offset + 1} - {Math.min(filters.offset + (filters.limit || 50), total)} de {total} resultados
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Página {Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1}
                    </div>
                  </div>
                )}

                <ul style={{ listStyle: "none", padding: 0 }}>
                  {resultados.length === 0 ? (
                    <p className="permiso-trabajo-label" style={{ textAlign: "center", padding: "20px 0" }}>
                      {filters.nombre 
                        ? "No hay resultados disponibles para este trabajador en el rango de fechas seleccionado." 
                        : "Selecciona un trabajador para ver sus registros."}
                    </p>
                  ) : (
                    resultados.map((r, idx) => (
                      <li
                        key={idx}
                        style={{
                          background: "#f7fbff",
                          marginBottom: 12,
                          padding: "12px 16px",
                          borderRadius: 8,
                          minWidth: 220,
                          maxWidth: 520,
                          fontSize: 14,
                          boxShadow: "0 1px 4px #e0e0e0",
                          marginLeft: "auto",
                          marginRight: "auto"
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <strong style={{ color: "#1a73e8" }}>Fecha:</strong> {r.fecha || "—"}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <strong style={{ color: "#1a73e8" }}>Nombre:</strong> {r.nombre || "—"}
                        </div>
                        <div style={{ 
                          marginTop: 12, 
                          paddingTop: 12, 
                          borderTop: "1px solid #e0e0e0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span style={{ fontSize: 13, color: "#666" }}>
                            Total de registros completados:
                          </span>
                          <span style={{ 
                            fontSize: 18, 
                            fontWeight: "bold", 
                            color: r.total_registros > 0 ? "#34a853" : "#ea4335" 
                          }}>
                            {r.total_registros || 0}
                          </span>
                        </div>
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

export default RegistrosDiariosAdmin;