import React, { useState } from "react";

/** Campos de encabezado generales del formulario */
const camposGenerales = [
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

/** Ítems de la lista de verificación para mantenimiento de torregrúa */
const items = [
  { grupo: "Base Grúa", nombre: "Voltaje de Alimentación Obra", tipo: "voltaje", obs: "" },
  { grupo: "Base Grúa", nombre: "Voltaje salida Autotransformador", tipo: "voltaje", obs: "" },
  { grupo: "Base Grúa", nombre: "Estado de contactos y ajuste de terminales", tipo: "brm", obs: "" },
  { grupo: "Base Grúa", nombre: "Estado Cableado (terminales hembra y macho)", tipo: "brm", obs: "" },
  { grupo: "Base Grúa", nombre: "Estado caja Braker", tipo: "brm", obs: "" },
  { grupo: "Base Grúa", nombre: "Polos a Tierra Torre grúa", tipo: "brm", obs: "" },
  { grupo: "Base Grúa", nombre: "Polos a Tierra Transformador", tipo: "brm", obs: "" },
  { grupo: "Base Grúa", nombre: "Contrapesos", tipo: "brm", obs: "" },
  { grupo: "Base Grúa", nombre: "Soportes estructura", tipo: "brm", obs: "" },
  { grupo: "Ascenso estructura", nombre: "Postura Pines y Pasadores", tipo: "sino", obs: "" },
  { grupo: "Ascenso estructura", nombre: "Estado Estructura Mástil", tipo: "brm", obs: "" },
  { grupo: "Ascenso estructura", nombre: "Estado estructura Secciones Telescopaje", tipo: "brm", obs: "" },
  { grupo: "Ascenso estructura", nombre: "Ajustar Letrero metálico", tipo: "sino", obs: "" },
  { grupo: "Ascenso estructura", nombre: "Ajuste arriostramiento, anillo,H", tipo: "brm", obs: "" },
  { grupo: "Cabina", nombre: "Estado de aseo", tipo: "brm", obs: "" },
  { grupo: "Cabina", nombre: "Ajuste Sillas/Estado Pisos", tipo: "brm", obs: "" },
  { grupo: "Cabina", nombre: "Seguros puerta y ventana", tipo: "brm", obs: "" },
  { grupo: "Cabina", nombre: "Barandas de Protección, pasadores y pines", tipo: "brm", obs: "" },
  { grupo: "Cabina", nombre: "Mando Alambrico/Inalambrico", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Estado estructura de flecha", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Postura Pines y Pasadores", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Punto Giratorio Cable Elevación", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Limitadores", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Estado Poleas/Guaya Distribución", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Carro Estructura/Patines/Poleas Elevación", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Canasta/Bandeja/llave Carro", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Motor Distribución Conexión y Funcionamiento", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Ventilador Motor Distribución", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Verificación Ajuste Freno Distribución", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Inspección Polea Dinamométrica", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Limitadores Dinamométricos", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Wincher/Reductor Distribución (Lubricación)", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Limitador Distribución", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Motor elevación Conexión y funcionamiento", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Ajuste/Calibración Freno de Elevación", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Wincher/Reductor Elevación (Lubricación)", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Alineación Wincher/Poleas Inicio Flecha", tipo: "brm", obs: "" },
  { grupo: "Flecha", nombre: "Limitador de Elevación", tipo: "brm", obs: "" },
  { grupo: "Tablero Eléctrico", nombre: "Estado General Cofre/Chapas", tipo: "brm", obs: "" },
  { grupo: "Tablero Eléctrico", nombre: "Barandas/Bandeja/Pines", tipo: "brm", obs: "" },
  { grupo: "Tablero Eléctrico", nombre: "Estado General Contactores (Funcionamiento, Desgaste)", tipo: "brm", obs: "" },
  { grupo: "Tablero Eléctrico", nombre: "Estado y funcionamiento Tarjetas/Serial Tapones", tipo: "brm", obs: "" },
  { grupo: "Tablero Eléctrico", nombre: "Alimentación General", tipo: "voltaje", obs: "" },
  { grupo: "Tablero Eléctrico", nombre: "Estado Cableado Tablero", tipo: "brm", obs: "" },
  { grupo: "Tablero Eléctrico", nombre: "Estado Cableado Alimentación Torre Grúa", tipo: "brm", obs: "" },
  { grupo: "Corona", nombre: "Estado y funcionamiento Limitadores de Momento", tipo: "brm", obs: "" },
  { grupo: "Corona", nombre: "Dentado Corona/Engrase Interno y Externo", tipo: "brm", obs: "" },
  { grupo: "Corona", nombre: "Motor de Giro Conexiones y Funcionamiento", tipo: "brm", obs: "" },
  { grupo: "Corona", nombre: "Ventilador Motor de Giro", tipo: "brm", obs: "" },
  { grupo: "Corona", nombre: "Limitador de Giro", tipo: "brm", obs: "" },
  { grupo: "Corona", nombre: "Reductor de Giro (Fugas y Lubricación)", tipo: "brm", obs: "" },
  { grupo: "Contra Flecha", nombre: "Estructura, barandas y Pines", tipo: "brm", obs: "" },
  { grupo: "Contra Flecha", nombre: "Contrapesos Aéreos", tipo: "brm", obs: "" },
  { grupo: "Contra Flecha", nombre: "Ajuste Avisos", tipo: "sino", obs: "" },
  { grupo: "Accesorios", nombre: "Estado general Gancho/Pastela/Poleas", tipo: "brm", obs: "" },
  { grupo: "Accesorios", nombre: "Lengüeta/Pestillo seguro", tipo: "brm", obs: "" },
  { grupo: "Accesorios", nombre: "Estado Baldes/Canasta", tipo: "brm", obs: "" },
  { grupo: "Accesorios", nombre: "Elementos de Izaje", tipo: "brm", obs: "" },
];

/**
 * ChecklistMentinimiento — lista de verificación de mantenimiento técnico para torregrúa.
 * Los ítems están agrupados por área funcional y se presentan en una tabla con opciones SI/NO/NA.
 * Envía mediante POST a /tecnicos/checklist_mantenimiento_grua al guardar.
 */
function ChecklistMentinimiento() {
  const [generales, setGenerales] = useState(
    camposGenerales.reduce((acc, campo) => {
      acc[campo.name] = "";
      return acc;
    }, {})
  );
  const [estadoItems, setEstadoItems] = useState(
    items.reduce((acc, item, idx) => {
      acc[idx] = "";
      return acc;
    }, {})
  );
  const [observaciones, setObservaciones] = useState(
    items.reduce((acc, item, idx) => {
      acc[idx] = "";
      return acc;
    }, {})
  );
  const [firmaRecibo, setFirmaRecibo] = useState({ firma: "", nombre: "", cargo: "" });
  const [ejecutadoPor, setEjecutadoPor] = useState({ tecnico: "", coordinador: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnvio, setMensajeEnvio] = useState("");

  const handleGeneralChange = (e) => {
    setGenerales({ ...generales, [e.target.name]: e.target.value });
  };

  const handleItemChange = (idx, valor) => {
    setEstadoItems({ ...estadoItems, [idx]: valor });
  };

  const handleObsChange = (idx, valor) => {
    setObservaciones({ ...observaciones, [idx]: valor });
  };

  const handleGuardar = async () => {
    setEnviando(true);
    setMensajeEnvio("");
    const payload = {
      generales,
      estadoItems,
      observaciones,
      firmaRecibo,
      ejecutadoPor
    };
    try {
      const res = await fetch("http://localhost:3000/gruaman/checklist_mentinimiento_grua", {
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

  const grupos = [];
  let lastGrupo = "";
  items.forEach((item, idx) => {
    if (item.grupo !== lastGrupo) {
      grupos.push({ grupo: item.grupo, indices: [idx] });
      lastGrupo = item.grupo;
    } else {
      grupos[grupos.length - 1].indices.push(idx);
    }
  });

  return (
    <div className="checklist-container">
      <h2 style={{ color: "#1976d2", marginBottom: 16 }}>CHEK LIST MANTENIMIENTO GRUAS</h2>
      <form>
        {/* Encabezado */}
        <div className="encabezado">
          {camposGenerales.map((campo) => (
            <div key={campo.name} className="campo">
              <label>{campo.label}:</label>
              <input
                type="text"
                name={campo.name}
                value={generales[campo.name]}
                onChange={handleGeneralChange}
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
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>#</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Grupo</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Descripción</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Seleccione</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Observación</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupoObj, gIdx) =>
                grupoObj.indices.map((idx, i) => {
                  const item = items[idx];
                  return (
                    <tr key={idx} style={{ background: i % 2 === 0 ? "#fff" : "#f5faff" }}>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>
                        {i === 0 ? item.grupo : ""}
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
                                  onChange={() => handleItemChange(idx, op)}
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
                                  onChange={() => handleItemChange(idx, op)}
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
                            onChange={(e) => handleItemChange(idx, e.target.value)}
                            placeholder="Volts"
                            style={{ width: 80, padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                          />
                        )}
                      </td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>
                        <input
                          type="text"
                          value={observaciones[idx]}
                          onChange={(e) => handleObsChange(idx, e.target.value)}
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

export default ChecklistMentinimiento;
