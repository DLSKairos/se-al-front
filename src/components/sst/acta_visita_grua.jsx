import React, { useState } from "react";

/** Campos de encabezado generales del formulario */
const generales = [
  { label: "Constructora", name: "constructora" },
  { label: "Nombre del Responsable SST en obra", name: "responsable_sst" },
  { label: "Fecha", name: "fecha" },
  { label: "Proyecto", name: "proyecto" },
  { label: "Responsable de la visita por parte de G&E", name: "responsable_visita" },
];

/** Condiciones de inspección agrupadas por sección */
const condiciones = [
  { grupo: "RIESGO LOCATIVO", items: [
    "El equipo cuenta con el respectivo cerramiento, demarcación y señalización del área.",
    "Acceso seguro al área de la torre grúa.",
    "El área de operación de la torre grúa no permite el ingreso de equipos ajenos al mismo.",
    "La torre grúa cuenta con línea de vida vertical, el elemento cuenta con la inspección anual y revisión por empresa certificada.",
    "La torre grúa cuenta con área de trabajo despejada.",
    "Orden y aseo en el área de trabajo (aplica para elevadores de carga).",
  ]},
  { grupo: "RIESGO ELÉCTRICO", items: [
    "El equipo cuenta con media, baja y baja tensión que corresponde y está dimensionada a los equipos de elevación, de acuerdo con la obra y especificación correspondiente (RETIE TA: 5mtx14mts; TM: 1.5mtx10mts; TB: 8mtx9mts).",
    "El equipo cuenta con acometida y polo a tierra.",
    "Se encuentran cables entregados adheridos a la estructura del equipo.",
    "Autotransformador se encuentra en buenas condiciones.",
    "Se evidencia conexión de equipos a la torre grúa que puedan generar picos de energía y puedan causar daños materiales.",
    "El área se encuentra libre de caída de agua y en buenas condiciones.",
    "El tablero eléctrico se encuentra en buenas condiciones libres de filtraciones de agua.",
  ]},
  { grupo: "INSPECCIÓN SEGURA AL TRABAJADOR", items: [
    "El trabajador cuenta con buen estado de salud, está en buenas condiciones para laborar.",
    "El operador cuenta con sus elementos de protección personal completos y en buen estado.",
    "El operador cuenta con sus elementos de protección contra caídas completos y en buen estado.",
    "Los documentos SST requeridos para el control operacional de los equipos de elevación se revisan, se actualizan y se dejan en campo según corresponda.",
    "El operador cuenta con un aparejador certificado o capacitado, el cual cuenta con chaleco reflectivo, silbato.",
    "El operador y aparejador cuentan con radio de comunicación y están en buen estado.",
  ]},
  { grupo: "IZAJE DE CARGAS, VIGAS DE ARRIOSTRAMIENTO", items: [
    "El equipo cuenta con la tabla de cargas.",
    "El equipo cuenta con plataformas adecuadas para el cargue y descargue de material para izaje, y estas cuentan con todos los pasamanos correspondientes.",
    "Orden y aseo en los accesorios de izaje (baldes de concreto, escombros, canastilla, paleta, gancho).",
    "Los accesorios de izaje están en buen estado.",
    "Inspección de las vigas de arriostramiento, anillo y paltinas (se encuentran bien instaladas).",
    "El bloque de carga se evidencia en buen estado (Gancho, Poleas, Terminal, Pasadores y Pines de seguridad).",
    "El mando inalámbrico se encuentra en normal funcionamiento (Operación desde piso).",
  ]},
  { grupo: "EQUIPOS DE EMERGENCIA", items: [
    "El equipo cuenta con botiquín (Cuando se realiza Ascensos).",
    "El equipo cuenta con extintor (Cuando se realiza Ascenso).",
  ]}
];

const opciones = ["S", "R", "NA"];

/**
 * ActaVisitaGrua — formulario de acta de visita SST para inspecciones de torregrúa.
 * Registra calificaciones de condición de seguridad (S/R/NA) por sección, además de firmas.
 * Envía mediante POST a /sst/acta_visita_grua al guardar.
 */
function ActaVisitaGrua() {
  const [datos, setDatos] = useState(
    generales.reduce((acc, campo) => {
      acc[campo.name] = "";
      return acc;
    }, {})
  );
  const [estadoItems, setEstadoItems] = useState(
    condiciones.flatMap(g => g.items).reduce((acc, item, idx) => {
      acc[idx] = "";
      return acc;
    }, {})
  );
  const [observaciones, setObservaciones] = useState(
    condiciones.flatMap(g => g.items).reduce((acc, item, idx) => {
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
      const res = await fetch("http://localhost:3000/gruaman/acta_visita_grua", {
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
      <h2 style={{ color: "#1976d2", marginBottom: 16 }}>ACTA DE VISITA DE SEGURIDAD Y SALUD EN EL TRABAJO (TORRE GRÚA)</h2>
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
        {/* Condiciones de seguridad */}
        <div style={{ background: "#f5faff", borderRadius: 8, padding: 12, marginBottom: 18, fontSize: "0.98rem", color: "#213547" }}>
          <strong>Condiciones de seguridad para tener en cuenta:</strong>
          <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
            <li>Está prohibido el acceso a la torre grúa de toda persona extraña al servicio de izaje, sin autorización expresa del propietario de la grúa.</li>
            <li>No utilizar elementos de la torre grúa para arrancar cargas adheridas al suelo o paredes, así como cualquier otra operación extraña a las propias del equipo.</li>
            <li>Utilizar los elementos de izaje para las operaciones de levantamiento de carga de acuerdo con el manual del proveedor; el primero no se usa o valida como guía de operación.</li>
            <li>Trabajar con terminales eléctricos, cuando se use el tiempo lluvioso con probabilidades de tormenta eléctrica se deben suspender las actividades de operación de los equipos de elevación.</li>
            <li>La zona de trabajo de la torre grúa debe estar completamente limpia, impedida el paso por ella a toda persona por debajo de la cabina.</li>
            <li>No operar el equipo con velocidades superiores a 70 km/h.</li>
            <li>Las cargas transportadas deben estar aseguradas por pasadores, pines, eslingas, baldes, canastillas, paletas y gancho de izaje y por aparejador, que no da tener formación e instrucciones precisas sobre este método de enganche y la utilización de los elementos de izaje.</li>
            <li>El operador y aparejador deben portar los elementos de protección personal completos y en buen estado.</li>
            <li>El operador y aparejador deben portar el chaleco reflectivo y silbato.</li>
            <li>El operador y aparejador deben portar radio de comunicación y estar en buen estado.</li>
            <li>Las vigas de arriostramiento deben estar certificadas y en buen estado.</li>
            <li>El equipo debe estar en óptimas condiciones de operación. HSE-FR-007. Señale aquí el motivo del diligenciamiento y describa el “código de señalización” que ha de ser sencillo y conocido por los dos. Siempre deben utilizarse los elementos de izaje y los equipos de izaje certificados.</li>
          </ul>
        </div>
        {/* Tabla de condiciones */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ background: "#f5faff" }}>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>#</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Grupo</th>
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Condición</th>
                {opciones.map(op => (
                  <th key={op} style={{ padding: 8, border: "1px solid #e3eafc" }}>{op}</th>
                ))}
                <th style={{ padding: 8, border: "1px solid #e3eafc" }}>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {condiciones.map((grupoObj, gIdx) =>
                grupoObj.items.map((item, i) => {
                  const idx = condiciones.slice(0, gIdx).reduce((a, g) => a + g.items.length, 0) + i;
                  return (
                    <tr key={idx} style={{ background: i % 2 === 0 ? "#fff" : "#f5faff" }}>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>
                        {i === 0 ? grupoObj.grupo : ""}
                      </td>
                      <td style={{ border: "1px solid #e3eafc", padding: 6 }}>{item}</td>
                      {opciones.map(op => (
                        <td key={op} style={{ border: "1px solid #e3eafc", padding: 6, textAlign: "center" }}>
                          <input
                            type="radio"
                            name={`item-${idx}`}
                            checked={estadoItems[idx] === op}
                            onChange={() => setEstadoItems({ ...estadoItems, [idx]: op })}
                          />
                        </td>
                      ))}
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
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                value={firmaRecibo.firma}
                onChange={e => setFirmaRecibo({ ...firmaRecibo, firma: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Nombre:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                value={firmaRecibo.nombre}
                onChange={e => setFirmaRecibo({ ...firmaRecibo, nombre: e.target.value })}
              />
            </div>
            <div>
              <label>Cargo:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                value={firmaRecibo.cargo}
                onChange={e => setFirmaRecibo({ ...firmaRecibo, cargo: e.target.value })}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 8, color: "#1976d2" }}>EJECUTADO POR</h4>
            <div style={{ marginBottom: 8 }}>
              <label>Nombre y Firma Técnico:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                value={ejecutadoPor.tecnico}
                onChange={e => setEjecutadoPor({ ...ejecutadoPor, tecnico: e.target.value })}
              />
            </div>
            <div>
              <label>Nombre y Firma Coordinador Mtto:</label>
              <input type="text" style={{ width: "100%", padding: 4, borderRadius: 6, border: "1px solid #90caf9" }}
                value={ejecutadoPor.coordinador}
                onChange={e => setEjecutadoPor({ ...ejecutadoPor, coordinador: e.target.value })}
              />
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

export default ActaVisitaGrua;
