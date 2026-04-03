import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    () => window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const onChange = (e) => setLandscape(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return landscape;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

/**
 * Pantalla posterior a la autenticación donde el trabajador selecciona su obra activa.
 *
 * Obtiene la lista de obras activas desde la API, solicita la geolocalización y
 * valida la posición del trabajador respecto al sitio seleccionado antes de navegar
 * al flujo de juego o a la pantalla lite de selección de formularios.
 *
 * @param {Object} props
 * @param {{ nombre: string, empresa: string, numero_identificacion: string }} props.usuario
 *   Datos del trabajador autenticado retornados por CedulaIngreso.
 */
function BienvenidaSeleccion({ usuario }) {
  const isLite = sessionStorage.getItem('lite_mode') === 'true';
  const isLandscape = useIsLandscape();
  const [obra_busqueda, setObraBusqueda] = useState("");
  const [lista_obras, setListaObras] = useState([]);
  const [obra_id_seleccionada, setObraIdSeleccionada] = useState("");
  const [ubicacion, setUbicacion] = useState({ lat: null, lon: null });
  const [gpsEstado, setGpsEstado] = useState("idle"); // idle | cargando | ok | error
  const [error, setError] = useState("");
  const [mostrarBocadillo, setMostrarBocadillo] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setMostrarBocadillo(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        const obrasActivas = (res.data.obras || []).filter(o => o.activa === true);
        setListaObras(obrasActivas);
      })
      .catch(() => setListaObras([]));
  }, []);

  useEffect(() => {
    if (!usuario) return;
    try {
      localStorage.setItem("usuario", JSON.stringify(usuario));
      if (usuario.nombre) localStorage.setItem("nombre_trabajador", usuario.nombre);
      if (usuario.numero_identificacion) localStorage.setItem("cedula_trabajador", usuario.numero_identificacion);
      if (usuario.empresa) localStorage.setItem("empresa_trabajador", usuario.empresa);
      const cargo = usuario.cargo || usuario.cargo_trabajador || usuario.puesto;
      if (cargo) localStorage.setItem("cargo_trabajador", cargo);
    } catch {
      // localStorage not available — continue without persistence
    }
  }, [usuario]);

  /**
   * Pide la ubicación GPS con opciones de alta precisión.
   * Actualiza gpsEstado: cargando → ok | error.
   */
  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsEstado("error");
      setError("Este dispositivo no soporta geolocalización.");
      return;
    }
    setGpsEstado("cargando");
    setError("");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsEstado("ok");
      },
      () => {
        setUbicacion({ lat: null, lon: null });
        setGpsEstado("error");
        setError("No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  /**
   * Sincroniza la obra seleccionada en localStorage y solicita la geolocalización.
   * Limpia los datos de obra persistidos cuando el campo se vacía.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleObraChange = e => {
    const nombre_obra = e.target.value;
    setObraBusqueda(nombre_obra);
    const obra_obj = lista_obras.find(o => o.nombre_obra === nombre_obra);
    if (obra_obj) {
      setObraIdSeleccionada(obra_obj.id);
      try {
        localStorage.setItem("obra", obra_obj.nombre_obra || "");
        localStorage.setItem("obra_id", String(obra_obj.id || ""));
        if (obra_obj.constructora) localStorage.setItem("constructora", obra_obj.constructora);
        if (obra_obj.nombre_obra) localStorage.setItem("nombre_proyecto", obra_obj.nombre_obra);
      } catch {
        // localStorage not available
      }
      requestGPS();
    } else {
      setObraIdSeleccionada("");
      setUbicacion({ lat: null, lon: null });
      setGpsEstado("idle");
      setError("");
      try {
        localStorage.removeItem("obra");
        localStorage.removeItem("obra_id");
        localStorage.removeItem("constructora");
        localStorage.removeItem("nombre_proyecto");
      } catch {
        // localStorage not available
      }
    }
  };

  /**
   * Ejecuta la validación y navegación una vez que ya hay coordenadas disponibles.
   * @param {{ lat: number, lon: number }} coords
   */
  const validarYNavegar = async (coords) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/validar_ubicacion`, {
        obra_id: obra_id_seleccionada,
        lat: coords.lat,
        lon: coords.lon
      });
      if (resp.data && resp.data.ok) {
        const obra_obj = lista_obras.find(o => o.id === obra_id_seleccionada);
        if (obra_obj) {
          try {
            localStorage.setItem("obra", obra_obj.nombre_obra || "");
            localStorage.setItem("obra_id", String(obra_obj.id || ""));
            if (obra_obj.constructora) localStorage.setItem("constructora", obra_obj.constructora);
            if (obra_obj.nombre_obra) localStorage.setItem("nombre_proyecto", obra_obj.nombre_obra);
          } catch {
            // localStorage not available
          }
        }
        // Only GyE (empresa_id=1) and AIC/Bomberman (empresa_id=2) use the game flow.
        // SST, Lideres and any other empresa always go to their classic form screens.
        const empresasConJuego = ["GyE", "AIC"];
        const usaJuego = empresasConJuego.includes(usuario.empresa) &&
                         sessionStorage.getItem('lite_mode') !== 'true';

        if (usaJuego) {
          const character = usuario.empresa === "GyE" ? "gruaman" : "bomberman";
          localStorage.setItem("selectedCharacter", character);
          navigate("/game/rotate-screen");
        } else {
          const formRoute = usuario.empresa === "GyE"       ? "/eleccion"
                          : usuario.empresa === "Lideres"  ? "/eleccion_lideres"
                          : usuario.empresa === "SST"      ? "/eleccion_sst"
                          : usuario.empresa === "Tecnicos" ? "/eleccion_tecnicos"
                          : "/eleccionaic";
          navigate(formRoute);
        }
      } else {
        const distancia = resp.data?.distancia;
        setError(
          distancia
            ? `Estás a ${distancia >= 1000 ? (distancia / 1000).toFixed(1) + " km" : distancia + " m"} de la obra. Debes estar a menos de 500 m.`
            : "No se encuentra en la ubicación seleccionada."
        );
      }
    } catch (err) {
      const distancia = err.response?.data?.distancia;
      setError(
        distancia
          ? `Estás a ${distancia >= 1000 ? (distancia / 1000).toFixed(1) + " km" : distancia + " m"} de la obra. Debes estar a menos de 500 m.`
          : "No se encuentra en la ubicación seleccionada."
      );
    }
  };

  /**
   * Valida la geolocalización del trabajador frente a la obra seleccionada mediante la API.
   * Si la ubicación aún no está disponible, la solicita en el momento del click.
   * Al tener éxito, redirige al flujo de juego o a la pantalla lite de selección de formularios.
   */
  const handleEmpezar = async () => {
    setError("");
    if (!obra_id_seleccionada) {
      setError("Selecciona una obra primero.");
      return;
    }

    // Opción C: si la ubicación no está lista, pedirla ahora y reintentar
    if (ubicacion.lat === null || ubicacion.lon === null) {
      if (!navigator.geolocation) {
        setError("Este dispositivo no soporta geolocalización.");
        return;
      }
      setGpsEstado("cargando");
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUbicacion(coords);
          setGpsEstado("ok");
          validarYNavegar(coords);
        },
        () => {
          setGpsEstado("error");
          setError("No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
      return;
    }

    validarYNavegar(ubicacion);
  };

  return (
    <div className="form-container" style={isLandscape ? { minHeight: "100vh", justifyContent: "center", paddingTop: "1rem", paddingBottom: "1rem" } : undefined}>
      {mostrarBocadillo && !isLite && !isLandscape && (
        <div style={{
          position: "fixed", top: "30vh", left: "50%", transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(22,34,56,0.75)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(0,212,255,0.3)", borderRadius: 18,
          padding: "20px 32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          textAlign: "center", minWidth: "280px", pointerEvents: "none",
        }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#00D4FF", marginBottom: 4 }}>
            Bienvenido
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(240,244,248,0.7)", fontSize: "0.9rem" }}>
            Operario certificado
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#F0F4F8", marginTop: 8 }}>
            {usuario.nombre}
          </div>
        </div>
      )}
      <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
        <h2 className="card-title" style={{ marginBottom: 18 }}>Selecciona tu obra de hoy</h2>
        <input
          className="input"
          list="lista-obras"
          placeholder="Buscar o selecciona la obra"
          value={obra_busqueda}
          onChange={handleObraChange}
          style={isLite ? { background: "#f7faff", border: "1.5px solid #c5d5ea" } : undefined}
        />
        <datalist id="lista-obras">
          {lista_obras.map((obra) => (
            <option key={obra.id} value={obra.nombre_obra}></option>
          ))}
        </datalist>
        {gpsEstado === "cargando" && (
          <div style={{ color: "#00D4FF", marginTop: 10, fontSize: "0.9rem" }}>
            Obteniendo ubicacion GPS...
          </div>
        )}
        {gpsEstado === "ok" && (
          <div style={{ color: "#00A32C", marginTop: 10, fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.3px", }}>
            Ubicacion confirmada
          </div>
        )}
        {gpsEstado === "error" && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>GPS no disponible</div>
            <button
              className="button"
              onClick={requestGPS}
            >
              Reintentar GPS
            </button>
          </div>
        )}
        <button className="button" onClick={handleEmpezar} style={{ marginTop: 18 }}>
          Empecemos
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </div>
      {!isLite && !isLandscape && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.05) 0%, transparent 60%)" }} />
      )}
    </div>
  );
}

export default BienvenidaSeleccion;
