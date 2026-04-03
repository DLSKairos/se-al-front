import React, { useState } from "react";

/** Campos de encabezado generales del formulario */
const generales = [
  { label: "Cliente", name: "cliente" },
  { label: "Obra", name: "obra" },
  { label: "Ciudad", name: "ciudad" },
  { label: "Fecha", name: "fecha" },
  { label: "Técnico", name: "tecnico" },
  { label: "Equipo", name: "equipo" },
  { label: "Serie", name: "serie" },
  { label: "Hora Inicio", name: "hora_inicio" },
  { label: "Hora Final", name: "hora_final" },
  { label: "Número de servicios desde su ingreso a obra", name: "num_servicios" },
];

/** Grupos e ítems de la lista de verificación para mantenimiento de elevador */
const grupos = [
  {
    grupo: "Base Elevador",
    items: [
      { nombre: "Voltaje de Alimentación Obra", tipo: "voltaje" },
      { nombre: "Voltaje salida Autotransformador", tipo: "voltaje" },
      { nombre: "Estado de contactos y ajuste de terminales", tipo: "brm" },
      { nombre: "Estado Cableado (terminales hembra y macho)", tipo: "brm" },
      { nombre: "Estado caja Braker", tipo: "brm" },
      { nombre: "Polos a Tierra Elevador Malacate", tipo: "brm" },
      { nombre: "Polos a Tierra Transformador", tipo: "brm" },
      { nombre: "Contrapesos", tipo: "brm" },
      { nombre: "Soportes estructura", tipo: "brm" },
    ],
  },
  {
    grupo: "Cabina",
    items: [
      { nombre: "Estado y Aseo", tipo: "sino" },
      { nombre: "Ajuste Piso", tipo: "brm" },
      { nombre: "Nivel antidestilizante piso", tipo: "brm" },
      { nombre: "Barandas de Protección salida", tipo: "sino" },
      { nombre: "Puertas Cierre y Apertura / Lubricación y Ajuste", tipo: "brm" },
      { nombre: "Guayas de las puertas", tipo: "brm" },
      { nombre: "Pernos de ajuste Guayas", tipo: "brm" },
      { nombre: "Rodamientos puertas", tipo: "brm" },
      { nombre: "Limitadores de Carga", tipo: "brm" },
      { nombre: "Limitadores de Peso", tipo: "brm" },
      { nombre: "Limitadores Ascenso", tipo: "brm" },
      { nombre: "Limitadores Descenso", tipo: "brm" },
    ],
  },
  {
    grupo: "Eléctrico",
    items: [
      { nombre: "Voltaje entrada Tablero", tipo: "voltaje" },
      { nombre: "Estado contactores Primarios", tipo: "brm" },
      { nombre: "Estado contactores Secundarios", tipo: "brm" },
      { nombre: "Cable alimentación Elevador", tipo: "brm" },
      { nombre: "Carrete cable eléctrico", tipo: "brm" },
      { nombre: "Mando Cabina", tipo: "brm" },
    ],
  },
  {
    grupo: "Motores",
    items: [
      { nombre: "Estado del marco de los motores", tipo: "brm" },
      { nombre: "Nivel de aceite de los motores", tipo: "brm" },
      { nombre: "Estado del asbesto discos de freno", tipo: "brm" },
      { nombre: "Ajuste de los frenos", tipo: "brm" },
      { nombre: "Voltaje de ingreso a motores", tipo: "voltaje" },
      { nombre: "Resistencia de los motores", tipo: "ohm" },
      { nombre: "Rodamientos", tipo: "brm" },
      { nombre: "Estado de Piñones", tipo: "brm" },
      { nombre: "Ajuste tornillos de sujeción motores", tipo: "brm" },
      { nombre: "Ajuste de tornillos marco Motores", tipo: "brm" },
      { nombre: "SI/NO", tipo: "sino" },
    ],
  },
];

/**
 * ChecklistMantenimientoElevador — lista de verificación de mantenimiento técnico para elevador de carga.
 * Registra calificaciones y observaciones por ítem agrupadas en secciones mecánicas y eléctricas.
 * Envía mediante POST a /tecnicos/checklist_mantenimiento_elevador al guardar.
 */
function ChecklistMantenimientoElevador() {
  const [datos, setDatos] = useState(
    generales.reduce((acc, campo) => {
      acc[campo.name] = "";
      return acc;
    }, {})
  );
  const [estadoItems, setEstadoItems] = useState(
    grupos.flatMap(g => g.items).reduce((acc, item, idx) => {
      acc[idx] = "";
      return acc;
    }, {})
  );
  const [observaciones, setObservaciones] = useState(
    grupos.flatMap(g => g.items).reduce((acc, item, idx) => {
      acc[idx] = "";
      return acc;
    }, {})
  );

  const [firmaRecibo, setFirmaRecibo] = useState({ firma: "", nombre: "", cargo: "" });
  const [ejecutadoPor, setEjecutadoPor] = useState({ tecnico: "", coordinador: "" });

  const [enviando, setEnviando] = useState(false);
  const [mensajeEnvio, setMensajeEnvio] = useState("");

  const handleGuardar = async () => {
    setEnviando(true);
    setMensajeEnvio("");
    const payload = {
      generales: datos,
      estadoItems,
      observaciones,
      firmaRecibo,
      ejecutadoPor
    };
    try {
      const res = await fetch("http://localhost:3000/gruaman/checklist_mantenimiento_elevador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMensajeEnvio("Datos enviados correctamente.");
      } else {
        setMensajeEnvio("Error al enviar datos.");
      }
    } catch (err) {
      setMensajeEnvio("Error de red: " + err.message);
    }
    setEnviando(false);
  };

  return (
    <div className="checklist-container">
      <h2 style={{ color: "#1976d2", marginBottom: 16 }}>CHEK LIST MANTENIMIENTO ELEVADOR</h2>
      <form>
        {/* Encabezado */}
        <div className="encabezado">
          {generales.map((campo) => (
            <div key={campo.name} className="campo">
              <label>{campo.label}:</label>
              <input
                type="text"
                name={campo.name}
                value={datos[campo.name]}
                onChange={e => setDatos({ ...datos, [campo.name]: e.target.value })}
                autoComplete="off"
              />
            </div>
          ))}
        </div>
        {/* Tabla de checklist */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ background: "#f5faff" }}>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Item</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Grupo</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Descripción</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Seleccione</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Observación</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupoObj, gIdx) =>
                grupoObj.items.map((item, i) => {
                  const idx = grupos.slice(0, gIdx).reduce((a, g) => a + g.items.length, 0) + i;
                  return (
                    <tr key={idx} style={{ background: i % 2 === 0 ? "#fff" : "#f5faff" }}>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>
                        {i === 0 ? grupoObj.grupo : ""}
                      </td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>{item.nombre}</td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>
                        {item.tipo === "brm" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            {["B", "R", "M"].map((op) => (
                              <label key={op} style={{ fontWeight: 600, color: op === "B" ? "#43a047" : op === "R" ? "#ffa726" : "#e53935" }}>
                                <input
                                  type="radio"
                                  name={`item-${idx}`}
                                  checked={estadoItems[idx] === op}
                                  onChange={() => setEstadoItems({ ...estadoItems, [idx]: op })}
                                  style={{ marginRight: 4 }}
                                />
                                {op}
                              </label>
                            ))}
                          </div>
                        )}
                        {item.tipo === "sino" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            {["SI", "NO"].map((op) => (
                              <label key={op} style={{ fontWeight: 600 }}>
                                <input
                                  type="radio"
                                  name={`item-${idx}`}
                                  checked={estadoItems[idx] === op}
                                  onChange={() => setEstadoItems({ ...estadoItems, [idx]: op })}
                                  style={{ marginRight: 4 }}
                                />
                                {op}
                              </label>
                            ))}
                          </div>
                        )}
                        {item.tipo === "voltaje" && (
                          <input
                            type="text"
                            name={`voltaje-${idx}`}
                            value={estadoItems[idx]}
                            onChange={e => setEstadoItems({ ...estadoItems, [idx]: e.target.value })}
                            placeholder="Volts"
                            style={{ width: 80, padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                          />
                        )}
                        {item.tipo === "ohm" && (
                          <input
                            type="text"
                            name={`ohm-${idx}`}
                            value={estadoItems[idx]}
                            onChange={e => setEstadoItems({ ...estadoItems, [idx]: e.target.value })}
                            placeholder="Ohmios"
                            style={{ width: 80, padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                          />
                        )}
                      </td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>
                        <input
                          type="text"
                          value={observaciones[idx]}
                          onChange={e => setObservaciones({ ...observaciones, [idx]: e.target.value })}
                          style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                          placeholder="Observación"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Firmas y ejecutado por */}
        <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 8, color: "#1976d2" }}>RECIBO CONFORME</h4>
            <div style={{ marginBottom: 8 }}>
              <label>Firma:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Nombre:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }} />
            </div>
            <div>
              <label>Cargo:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 8, color: "#1976d2" }}>EJECUTADO POR</h4>
            <div style={{ marginBottom: 8 }}>
              <label>Nombre y Firma Técnico:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }} />
            </div>
            <div>
              <label>Nombre y Firma Coordinador Mtto:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }} />
            </div>
          </div>
        </div>
        {/* Botón de guardar y mensaje de resultado */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            type="button"
            className="btn-guardar"
            onClick={handleGuardar}
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Guardar"}
          </button>
          {mensajeEnvio && (
            <div style={{ marginTop: 12, fontWeight: 600, color: "#1976d2" }}>
              {mensajeEnvio}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default ChecklistMantenimientoElevador;
