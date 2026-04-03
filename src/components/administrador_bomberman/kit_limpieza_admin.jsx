import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const ITEMS_LABELS = {
  detergente_polvo:        'DETERGENTE EN POLVO',
  jabon_rey:               'JABON REY',
  espatula_flexible:       'ESPATULA FLEXIBLE',
  grasa_litio:             'GRASA LITIO',
  aceite_hidraulico:       'ACEITE HIDRAULICO',
  plastico_grueso:         'PLASTICO GRUESO',
  talonario_bombeo:        'TALONARIO DE BOMBEO',
  extintor:                'EXTINTOR',
  botiquin:                'BOTIQUIN',
  grasera:                 'GRASERA',
  manguera_inyector_grasa: 'MANGUERA PARA INYECTOR DE GRASA',
  radio:                   'RADIO',
  auricular:               'AURICULAR',
  pimpina_acpm:            'PIMPINA ACPM',
  bola_limpieza:           'BOLA DE LIMPIEZA',
  perros:                  'PERROS',
  guaya:                   'GUAYA',
};

function toYMD(date) {
  if (!date) return '';
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Date(date).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function KitLimpiezaAdmin() {
  const [activeBar, setActiveBar] = useState("");
  const [filters, setFilters] = useState({
    nombre: "", obra: "", constructora: "", bomba_numero: "",
    fecha_inicio: "", fecha_fin: "", limit: 50, offset: 0
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
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  async function handleBuscar() {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || '',
        obra: filters.obra || '',
        constructora: filters.constructora || '',
        bomba_numero: filters.bomba_numero || '',
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };
      const res = await axios.post(`${API_BASE_URL}/kit_limpieza_admin/buscar`, body);
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
        obra: filters.obra || '',
        constructora: filters.constructora || '',
        bomba_numero: filters.bomba_numero || '',
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        formato: tipo,
        limit: 50000
      };
      const res = await axios.post(`${API_BASE_URL}/kit_limpieza_admin/descargar`, body, { responseType: 'blob' });
      const mime = tipo === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/zip';
      const ext = tipo === 'excel' ? 'xlsx' : 'zip';
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kit_limpieza.${ext}`);
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
          setNombresOperarios(
            res.data.datos.filter(d => Number(d.empresa_id) === 2 || Number(d.empresa_id) === 5).map(d => d.nombre)
          );
        }
      } catch { setNombresOperarios([]); }
    }
    fetchNombres();

    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        const obras = (res.data.obras || []).filter(o => Number(o.empresa_id) === 2 || Number(o.empresa_id) === 5);
        setListaObras(obras);
        setListaConstructoras(Array.from(new Set(obras.map(o => o.constructora).filter(Boolean))));
      })
      .catch(() => { setListaObras([]); setListaConstructoras([]); });
  }, []);

  useEffect(() => {
    if (activeBar === "ver") handleBuscar();
    // eslint-disable-next-line
  }, [filters.offset, filters.limit]);

  const renderFiltros = (forAction) => (
    <div className="card-section" style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 10, fontWeight: 600, color: "#222", fontSize: 15 }}>
        Ingresa uno o más parámetros para filtrar:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Nombre operador</label>
          <input className="permiso-trabajo-input" type="text" name="nombre"
            value={filters.nombre} onChange={handleFilterChange}
            placeholder="Buscar nombre" style={{ width: "93%" }}
            list="lista-nombres-kl" disabled={loading} />
          <datalist id="lista-nombres-kl">
            {nombresOperarios.map((n, i) => <option key={i} value={n} />)}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Bomba N°</label>
          <input className="permiso-trabajo-input" type="text" name="bomba_numero"
            value={filters.bomba_numero} onChange={handleFilterChange}
            placeholder="Número de bomba" style={{ width: "93%" }} disabled={loading} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Obra</label>
          <input className="permiso-trabajo-input" type="text" name="obra"
            value={filters.obra} onChange={handleFilterChange}
            placeholder="Buscar obra" style={{ width: "93%" }}
            list="lista-obras-kl" disabled={loading} />
          <datalist id="lista-obras-kl">
            {listaObras.map(o => <option key={o.id} value={o.nombre_obra} />)}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Constructora</label>
          <input className="permiso-trabajo-input" type="text" name="constructora"
            value={filters.constructora} onChange={handleFilterChange}
            placeholder="Buscar constructora" style={{ width: "93%" }}
            list="lista-constructoras-kl" disabled={loading} />
          <datalist id="lista-constructoras-kl">
            {listaConstructoras.map((c, i) => <option key={i} value={c} />)}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Rango de Fechas</label>
          <input className="permiso-trabajo-input" type="date" name="fecha_inicio"
            value={filters.fecha_inicio} onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }} disabled={loading} />
          <input className="permiso-trabajo-input" type="date" name="fecha_fin"
            value={filters.fecha_fin} onChange={handleFilterChange}
            style={{ width: "93%" }} disabled={loading} />
        </div>
        {forAction === "ver" ? (
          <button className="permiso-trabajo-btn" onClick={handleBuscar}
            style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            Buscar
          </button>
        ) : (
          <button className="permiso-trabajo-btn" onClick={() => handleDescargar(forAction)}
            style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            Descargar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="form-container">
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Kit de Lavado y Mantenimiento - Admin</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", marginBottom: 18 }}>
          <button className="permiso-trabajo-btn" style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("ver")} disabled={loading}>Ver</button>
          <button className="permiso-trabajo-btn" style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("excel")} disabled={loading}>Descargar en Excel</button>
          <button className="permiso-trabajo-btn" style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("pdf")} disabled={loading}>Descargar en PDF</button>
        </div>

        {activeBar && renderFiltros(activeBar)}

        {activeBar === "ver" && (
          <div className="card-section" style={{ marginTop: 12 }}>
            {loading ? (
              <p className="permiso-trabajo-label">Cargando datos...</p>
            ) : (
              <>
                <div style={{ marginBottom: 10, fontSize: 14, color: "#222" }}>
                  {total > 0 && (
                    <span>
                      Mostrando {filters.offset + 1} – {Math.min(filters.offset + (filters.limit || 50), total)} de {total} resultados
                    </span>
                  )}
                </div>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {resultados.length === 0 ? (
                    <p className="permiso-trabajo-label">No hay resultados.</p>
                  ) : (
                    resultados.map((r, idx) => {
                      const uid = r.raw?.id || idx;
                      return (
                        <li key={uid} style={{
                          background: "#f7fbff", marginBottom: 12, padding: "10px 12px",
                          borderRadius: 8, maxWidth: 340, fontSize: 14,
                          boxShadow: "0 1px 4px #e0e0e0", marginLeft: "auto", marginRight: "auto"
                        }}>
                          <div><strong>Fecha:</strong> {r.fecha || "—"}</div>
                          <div><strong>Operador:</strong> {r.nombre || "—"}</div>
                          <div><strong>Bomba:</strong> {r.bomba || "—"}</div>
                          <div><strong>Obra:</strong> {r.obra || "—"}</div>
                          <div><strong>Constructora:</strong> {r.constructora || "—"}</div>
                          {openId === uid && r.raw && (
                            <div style={{
                              background: "#fff", border: "1px solid #e0e0e0",
                              borderRadius: 8, marginTop: 10, padding: "10px 8px", fontSize: 12
                            }}>
                              {Object.entries(ITEMS_LABELS).map(([base, label]) => (
                                <div key={base} style={{ marginBottom: 3 }}>
                                  <strong>{label}:</strong>{" "}
                                  Buena: {r.raw[`${base}_buena`] ?? 0} |{" "}
                                  Mala: {r.raw[`${base}_mala`] ?? 0} |{" "}
                                  Estado: {r.raw[`${base}_estado`] || "—"}
                                </div>
                              ))}
                              {r.raw.observaciones && (
                                <div style={{ marginTop: 6 }}>
                                  <strong>Observaciones:</strong> {r.raw.observaciones}
                                </div>
                              )}
                            </div>
                          )}
                          <button className="permiso-trabajo-btn"
                            style={{ marginTop: 8, fontSize: 13, padding: "4px 10px" }}
                            onClick={() => setOpenId(openId === uid ? null : uid)}>
                            {openId === uid ? "Ocultar detalles" : "Ver más"}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
                {total > (filters.limit || 50) && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
                    <button className="permiso-trabajo-btn" style={{ minWidth: 90 }}
                      disabled={loading || filters.offset === 0}
                      onClick={() => setFilters(f => ({ ...f, offset: Math.max(0, f.offset - (f.limit||50)) }))}>
                      Anterior
                    </button>
                    <button className="permiso-trabajo-btn" style={{ minWidth: 90 }}
                      disabled={loading || filters.offset + (filters.limit||50) >= total}
                      onClick={() => setFilters(f => ({ ...f, offset: f.offset + (f.limit||50) }))}>
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

export default KitLimpiezaAdmin;
