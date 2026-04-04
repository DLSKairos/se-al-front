import React, { useState, useEffect } from "react";
import axios from "axios";
import { registerWebAuthn, authenticateWebAuthn, WebAuthnError, checkWebAuthnSupport } from "./components/webauthn";
import { subscribeUser } from "./pushNotifications";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

/**
 * Se suscribe a cambios en el ancho del viewport y retorna true cuando
 * este es menor a 600 px.
 *
 * @returns {boolean}
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 600 : true
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 599px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isMobile;
}

/**
 * Convierte un empresa_id numérico a su identificador de unidad de negocio en cadena.
 *
 * @param {number|string} id - empresa_id proveniente de la respuesta de la API.
 * @returns {'GyE'|'AIC'|'SST'|'Lideres'|''}
 */
function empresaFromId(id) {
  const n = Number(id);
  if (n === 1) return "GyE";
  if (n === 2) return "AIC";
  if (n === 3) return "Tecnicos";
  if (n === 4) return "SST";
  if (n === 5) return "Lideres";
  return "";
}

/**
 * Pantalla de ingreso por cédula con autenticación biométrica (WebAuthn) y
 * fallback por PIN.
 *
 * Flujo de autenticación:
 * 1. El trabajador ingresa su número de identificación.
 * 2. El componente consulta /datos_basicos y valida que el trabajador esté activo.
 * 3. Si el dispositivo soporta WebAuthn y el trabajador no tiene credencial registrada,
 *    registra una nueva. Si ya existe, autentica con ella.
 * 4. En dispositivos sin soporte WebAuthn se usa el flujo basado en PIN.
 * 5. Al tener éxito, invoca onUsuarioEncontrado con el objeto de trabajador normalizado.
 *
 * También provee un modal de login de administrador que redirige al panel
 * correspondiente según el rol retornado por /admin/login.
 *
 * @param {Object} props
 * @param {Function} props.onUsuarioEncontrado - Se llama con el objeto del trabajador autenticado.
 */
function CedulaIngreso({ onUsuarioEncontrado }) {
  const handleUsuarioAutenticado = (usuario, empresa_id) => {
    localStorage.setItem("nombre_trabajador", usuario.nombre || "");
    localStorage.setItem("cedula_trabajador", usuario.numero_identificacion || "");
    localStorage.setItem("empresa_id", String(empresa_id || ""));
    onUsuarioEncontrado && onUsuarioEncontrado(usuario);
  };

  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [gifIndex, setGifIndex] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminShowPass, setAdminShowPass] = useState(false);
  const [showRegistrarLlaveModal, setShowRegistrarLlaveModal] = useState(false);
  const [registrarLlaveLoading, setRegistrarLlaveLoading] = useState(false);
  const [pendingUsuario, setPendingUsuario] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModo, setPinModo] = useState('verificar');
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const isMobile = useIsMobile();
  const isLite   = sessionStorage.getItem('lite_mode') === 'true';

  useEffect(() => {
    if (isLite) return; // sin GIFs rotativos en modo lite
    const gifs = ["/gruaman1.1.gif", "/bomberman1.1.gif"];
    const interval = setInterval(() => {
      setGifIndex(prev => (prev + 1) % gifs.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLite]);

  const handleBuscar = async () => {
    setError("");
    if (!cedula) {
      setError("Por favor ingresa tu número de identificación.");
      return;
    }
    try {
      const resp = await axios.get(`${API_BASE_URL}/datos_basicos`);
      const datosArray = Array.isArray(resp.data.datos) ? resp.data.datos : (Array.isArray(resp.data) ? resp.data : []);
      // Solo permitir ingreso si activo === true
      const usuario = datosArray.find(u => {
        const id = u.numero_identificacion || u.cedula || u.id || "";
        return id === cedula && u.activo === true;
      }) || null;

      if (usuario) {
        try {
          const nombre = usuario.nombre || usuario.nombres || usuario.nombre_trabajador || "";
          const numeroId = usuario.numero_identificacion || usuario.cedula || usuario.id || cedula;
          const cargo = usuario.cargo || usuario.cargo_trabajador || usuario.puesto || "";
          const empresaName = empresaFromId(usuario.empresa_id) || usuario.empresa || "";
          const obra = usuario.obra || usuario.nombre_proyecto || usuario.nombre_obra || "";

          localStorage.setItem("nombre_trabajador", nombre);
          localStorage.setItem("usuario", JSON.stringify(usuario));
          localStorage.setItem("cedula_trabajador", numeroId);
          localStorage.setItem("cedula", numeroId);
          if (cargo) localStorage.setItem("cargo_trabajador", cargo);
          if (empresaName) localStorage.setItem("empresa_trabajador", empresaName);
          if (obra) {
            localStorage.setItem("obra", obra);
            localStorage.setItem("nombre_proyecto", obra);
          }
        } catch {
          // localStorage not available
        }

        try {
          const pinRes = await axios.get(`${API_BASE_URL}/auth/pin/status?numero_identificacion=${encodeURIComponent(cedula)}`);
          const pinStatus = pinRes.data;
          if (pinStatus && pinStatus.pinHabilitado) {
            setPendingUsuario(usuario);
            setPinModo(pinStatus.pinConfigurado ? 'verificar' : 'crear');
            setPinInput('');
            setPinConfirm('');
            setPinError('');
            setShowPinModal(true);
            return;
          }
        } catch {
          // PIN status unavailable — proceed with biometric flow
        }

        if ("Notification" in window && "serviceWorker" in navigator) {
          try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              const numeroId = usuario.numero_identificacion || usuario.cedula || usuario.id || cedula;
              await subscribeUser(numeroId).catch(() => {});
            }
          } catch {
            // Push subscription not critical — continue
          }
        }

        const soportaBiometria = await checkWebAuthnSupport();
        if (!soportaBiometria) {
          setDiagnostico({
            titulo: 'Este dispositivo no puede usar huella dactilar',
            pasos: [
              'Verifica que tengas Google Services instalado y actualizado.',
              'Asegúrate de tener una cuenta de Google activa y configurada en el teléfono.',
              'Revisa que tengas huella dactilar registrada en Ajustes → Seguridad.',
              'Revisa que las Llaves de acceso estén habilitadas en tu cuenta de Google (passwords.google.com).',
              'Si ninguna de las anteriores aplica, contacta al administrador.'
            ]
          });
          return;
        }

        let biometriaRegistrada = false;
        try {
          const res = await axios.post(`${API_BASE_URL}/webauthn/hasCredential`, { numero_identificacion: cedula });
          biometriaRegistrada = !!(res.data && res.data.hasCredential);
        } catch {
          biometriaRegistrada = false;
        }

        if (!biometriaRegistrada) {
          try {
            await registerWebAuthn({ numero_identificacion: cedula, nombre: usuario.nombre });
          } catch (e) {
            if (e instanceof WebAuthnError && e.code === 'USER_CANCELLED') {
              setError("Cancelaste el registro de huella. Inténtalo de nuevo.");
            } else {
              setError("No se pudo registrar la biometría. Verifica que tengas huella dactilar configurada en los ajustes del teléfono.");
            }
            return;
          }
        } else {
          try {
            await authenticateWebAuthn({ numero_identificacion: cedula });
          } catch (e) {
            if (e instanceof WebAuthnError && e.code === 'USER_CANCELLED') {
              setError("Cancelaste la autenticación. Inténtalo de nuevo.");
              return;
            }

            if (e instanceof WebAuthnError && e.code === 'NO_CREDENTIALS') {
              setPendingUsuario(usuario);
              setShowRegistrarLlaveModal(true);
              return;
            }

            setError("No se pudo autenticar. Inténtalo de nuevo.");
            return;
          }
        }

        handleUsuarioAutenticado({
          nombre: usuario.nombre,
          empresa: empresaFromId(usuario.empresa_id),
          numero_identificacion: usuario.numero_identificacion
        }, usuario.empresa_id);
      } else {
        setError("No estás registrado en el sistema o tu usuario está inactivo.");
      }
    } catch {
      setError("No estás registrado en el sistema.");
    }
  };

  /**
   * Envía las credenciales de administrador a /admin/login y redirige al panel
   * de administración correspondiente si el inicio de sesión es exitoso.
   */
  const handleAdminLogin = async () => {
    setAdminError("");
    setAdminLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPass }),
      });
      const data = await response.json();
      if (data.success) {
        setAdminError("");
        setShowAdminModal(false);
        localStorage.setItem("admin_rol", data.rol);
        if (data.rol === "gruaman" || data.rol === "bomberman") {
          window.location.href = "/admin";
        } else {
          setAdminError("Rol no reconocido.");
        }
      } else {
        setAdminError(data.error || "Contraseña incorrecta.");
      }
    } catch {
      setAdminError("Error de conexión.");
    } finally {
      setAdminLoading(false);
    }
  };

  /**
   * Registra una nueva credencial WebAuthn para el trabajador pendiente en este dispositivo.
   * Se utiliza cuando la credencial del trabajador está almacenada en otro dispositivo.
   */
  const handleRegistrarNuevaLlave = async () => {
    if (!pendingUsuario) return;
    setRegistrarLlaveLoading(true);
    setError("");
    try {
      const numeroId = pendingUsuario.numero_identificacion || pendingUsuario.cedula || pendingUsuario.id || cedula;
      const nombre = pendingUsuario.nombre || pendingUsuario.nombres || pendingUsuario.nombre_trabajador || "";
      await registerWebAuthn({ numero_identificacion: numeroId, nombre });
      setShowRegistrarLlaveModal(false);
      handleUsuarioAutenticado({
        nombre: pendingUsuario.nombre,
        empresa: empresaFromId(pendingUsuario.empresa_id),
        numero_identificacion: pendingUsuario.numero_identificacion
      }, pendingUsuario.empresa_id);
      setPendingUsuario(null);
    } catch {
      setError("No se pudo registrar la nueva llave de acceso en este dispositivo.");
      setShowRegistrarLlaveModal(false);
      setPendingUsuario(null);
    } finally {
      setRegistrarLlaveLoading(false);
    }
  };

  const handleCancelarRegistroLlave = () => {
    setShowRegistrarLlaveModal(false);
    setPendingUsuario(null);
    setError("Debes registrar una llave de acceso para continuar.");
  };

  /**
   * Gestiona el envío del PIN tanto en modo creación ('crear') como en verificación ('verificar').
   * Al tener éxito, llama a handleUsuarioAutenticado y limpia el estado pendiente.
   */
  const handlePinSubmit = async () => {
    if (!pendingUsuario) return;
    const numeroId = pendingUsuario.numero_identificacion || cedula;
    setPinError('');

    if (!/^\d{4,8}$/.test(pinInput)) {
      setPinError('El PIN debe ser numérico de 4 a 8 dígitos.');
      return;
    }

    if (pinModo === 'crear') {
      if (pinInput !== pinConfirm) {
        setPinError('Los PINes no coinciden.');
        return;
      }
      setPinLoading(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/pin/set`, { numero_identificacion: numeroId, pin: pinInput });
        if (res.data.success) {
          setShowPinModal(false);
          setPendingUsuario(null);
          handleUsuarioAutenticado({
            nombre: pendingUsuario.nombre,
            empresa: empresaFromId(pendingUsuario.empresa_id),
            numero_identificacion: numeroId
          }, pendingUsuario.empresa_id);
        } else {
          setPinError(res.data.error || 'No se pudo guardar el PIN.');
        }
      } catch (e) {
        setPinError('Error de conexión al guardar el PIN.');
      } finally {
        setPinLoading(false);
      }
    } else {
      setPinLoading(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/pin/verify`, { numero_identificacion: numeroId, pin: pinInput });
        if (res.data.success) {
          setShowPinModal(false);
          setPendingUsuario(null);
          handleUsuarioAutenticado({
            nombre: pendingUsuario.nombre,
            empresa: empresaFromId(pendingUsuario.empresa_id),
            numero_identificacion: numeroId
          }, pendingUsuario.empresa_id);
        } else {
          setPinError('PIN incorrecto. Inténtalo de nuevo.');
        }
      } catch (e) {
        if (e.response?.status === 401) {
          setPinError('PIN incorrecto. Inténtalo de nuevo.');
        } else {
          setPinError('Error de conexión al verificar el PIN.');
        }
      } finally {
        setPinLoading(false);
      }
    }
  };

  return (
    <div className="form-container" style={{ position: "relative", minHeight: "100vh" }}>
      <div
        className="card-section"
        style={{
          background: isLite ? "rgba(22,34,56,0.92)" : "rgba(255,255,255,0.22)",
          borderRadius: "18px",
          boxShadow: isLite ? "0 0 0 1px rgba(0,212,255,0.2)" : "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          backdropFilter: isLite ? undefined : "blur(8px)",
          WebkitBackdropFilter: isLite ? undefined : "blur(8px)",
          border: isLite ? "1px solid rgba(0,212,255,0.25)" : "1px solid rgba(255,255,255,0.28)",
          padding: "32px 24px",
          maxWidth: 400,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h2 className="card-title">Ingresa tu número de identificación</h2>
        <input
          className="input"
          type="text"
          value={cedula}
          onChange={e => setCedula(e.target.value)}
          placeholder="Número de identificación"
          style={isLite ? { background: "rgba(22,34,56,0.92)", border: "1px solid rgba(0,212,255,0.2)" } : undefined}
        />
        <button className="button" onClick={handleBuscar} style={{ marginTop: 16 }}>
          Continuar
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </div>

      <button
        className="button"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "#00D4FF",
          color: "#0C1624",
          border: "none",
          borderRadius: 8,
          padding: "12px 20px",
          boxShadow: "0 0 16px rgba(0,212,255,0.4)",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 0.5,
          cursor: "pointer",
          fontFamily: "'Syne', sans-serif"
        }}
        onClick={() => {
          setShowAdminModal(true);
          setAdminPass("");
          setAdminError("");
        }}
      >
        Ingreso administrador
      </button>
      {showAdminModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(31,38,135,0.13)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: isLite ? "rgba(22,34,56,0.92)" : "rgba(255,255,255,0.22)",
              borderRadius: 18,
              boxShadow: isLite ? "0 0 0 1px rgba(0,212,255,0.2)" : "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              backdropFilter: isLite ? undefined : "blur(8px)",
              WebkitBackdropFilter: isLite ? undefined : "blur(8px)",
              border: isLite ? "1px solid rgba(0,212,255,0.25)" : "1.5px solid rgba(255,255,255,0.28)",
              padding: "32px 24px",
              minWidth: 300,
              textAlign: "center",
              position: "relative",
              fontFamily: "inherit"
            }}
          >
            <h3 style={{ marginBottom: 18, color: "#00D4FF", fontWeight: 700, letterSpacing: 1 }}>
              Bienvenido administrador
            </h3>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 320,
                margin: "0 auto 14px auto",
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 8,
                border: "1.5px solid #00D4FF",
                boxShadow: "0 2px 8px rgba(0,212,255,0.07)",
                transition: "box-shadow 0.2s",
              }}
            >
              <input
                type={adminShowPass ? "text" : "password"}
                placeholder="Contraseña"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 44px 12px 14px",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  background: "transparent",
                  color: "#F0F4F8",
                  fontFamily: "inherit",
                  outline: "none",
                  minWidth: 0,
                }}
                onKeyDown={e => { if (e.key === "Enter") handleAdminLogin(); }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setAdminShowPass(v => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  margin: 0,
                  outline: "none",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  height: 32,
                  width: 32,
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background 0.15s",
                }}
                aria-label={adminShowPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                onMouseDown={e => e.preventDefault()}
              >
                {adminShowPass ? (
                  // Ojo abierto SVG
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="12" rx="7" ry="5" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                ) : (
                  // Ojo cerrado SVG
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.61 3.36-4.77 6-6.11" />
                    <path d="M1 1l22 22" />
                  </svg>
                )}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                className="button"
                onClick={handleAdminLogin}
                style={{
                  background: "#00D4FF",
                  color: "#0C1624",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 22px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 0 12px rgba(0,212,255,0.3)",
                  letterSpacing: 0.5
                }}
                disabled={adminLoading}
              >
                {adminLoading ? "Ingresando..." : "Ingresar"}
              </button>
              <button
                className="button"
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: "rgba(22,34,56,0.6)",
                  color: "rgba(240,244,248,0.7)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: "none",
                  letterSpacing: 0.5
                }}
                disabled={adminLoading}
              >
                Cancelar
              </button>
            </div>
            {adminError && <div style={{ color: "#c00", marginTop: 14, fontWeight: 500 }}>{adminError}</div>}
          </div>
        </div>
      )}
      
      {showRegistrarLlaveModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(31,38,135,0.18)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: isLite ? "rgba(22,34,56,0.92)" : "rgba(255,255,255,0.28)",
              borderRadius: 18,
              boxShadow: isLite ? "0 0 0 1px rgba(0,212,255,0.2)" : "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              backdropFilter: isLite ? undefined : "blur(12px)",
              WebkitBackdropFilter: isLite ? undefined : "blur(12px)",
              border: isLite ? "1px solid rgba(0,212,255,0.25)" : "1.5px solid rgba(255,255,255,0.35)",
              padding: "32px 24px",
              minWidth: 300,
              maxWidth: 360,
              textAlign: "center",
              position: "relative",
              fontFamily: "inherit"
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                <path d="M12 11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
                <path d="M19 11h-4" />
                <path d="M15 7v8" />
                <path d="M12 11h-3" />
                <circle cx="9" cy="11" r="6" />
              </svg>
            </div>
            
            <h3 style={{ marginBottom: 14, color: "#00D4FF", fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>
              Registrar llave de acceso
            </h3>
            
            <p style={{ color: "rgba(240,244,248,0.85)", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
              No hay llaves de acceso disponibles en este dispositivo.
            </p>

            <p style={{ color: "rgba(240,244,248,0.65)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              ¿Deseas registrar una nueva llave de acceso (huella dactilar o Face ID) para iniciar sesión desde este dispositivo?
            </p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                className="button"
                onClick={handleRegistrarNuevaLlave}
                disabled={registrarLlaveLoading}
                style={{
                  background: "#00D4FF",
                  color: "#0C1624",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: registrarLlaveLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 0 12px rgba(0,212,255,0.3)",
                  letterSpacing: 0.5,
                  opacity: registrarLlaveLoading ? 0.7 : 1
                }}
              >
                {registrarLlaveLoading ? "Registrando..." : "Sí, registrar"}
              </button>
              <button
                className="button"
                onClick={handleCancelarRegistroLlave}
                disabled={registrarLlaveLoading}
                style={{
                  background: "rgba(22,34,56,0.6)",
                  color: "rgba(240,244,248,0.5)",
                  border: "1px solid rgba(0,212,255,0.25)",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: registrarLlaveLoading ? "not-allowed" : "pointer",
                  boxShadow: "none",
                  letterSpacing: 0.5
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showPinModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(31,38,135,0.18)", zIndex: 10002,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: isLite ? "rgba(22,34,56,0.92)" : "rgba(255,255,255,0.28)", borderRadius: 18,
            boxShadow: isLite ? "0 0 0 1px rgba(0,212,255,0.2)" : "0 8px 32px 0 rgba(31,38,135,0.37)",
            backdropFilter: isLite ? undefined : "blur(12px)", WebkitBackdropFilter: isLite ? undefined : "blur(12px)",
            border: isLite ? "1px solid rgba(0,212,255,0.25)" : "1.5px solid rgba(255,255,255,0.35)",
            padding: "32px 24px", minWidth: 300, maxWidth: 360,
            textAlign: "center", fontFamily: "inherit"
          }}>
            <div style={{ marginBottom: 14 }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 style={{ marginBottom: 8, color: "#00D4FF", fontWeight: 700, fontSize: 18 }}>
              {pinModo === 'crear' ? 'Crea tu PIN de acceso' : 'Ingresa tu PIN'}
            </h3>
            {pinModo === 'crear' && (
              <p style={{ color: "rgba(240,244,248,0.65)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                Este dispositivo usará un PIN en lugar de huella dactilar. Elige un PIN de 4 a 8 dígitos.
              </p>
            )}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder={pinModo === 'crear' ? 'Nuevo PIN (4-8 dígitos)' : 'Tu PIN'}
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') handlePinSubmit(); }}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", border: "1.5px solid #00D4FF",
                borderRadius: 8, fontSize: 20, letterSpacing: 6,
                textAlign: "center", background: "rgba(255,255,255,0.06)", color: "#F0F4F8",
                marginBottom: 12, outline: "none", fontFamily: "inherit"
              }}
              autoFocus
            />
            {pinModo === 'crear' && (
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="Confirmar PIN"
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handlePinSubmit(); }}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 14px", border: "1.5px solid #00D4FF",
                  borderRadius: 8, fontSize: 20, letterSpacing: 6,
                  textAlign: "center", background: "rgba(255,255,255,0.06)", color: "#F0F4F8",
                  marginBottom: 12, outline: "none", fontFamily: "inherit"
                }}
              />
            )}
            {pinError && <div style={{ color: "#c00", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{pinError}</div>}
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={handlePinSubmit}
                disabled={pinLoading}
                style={{
                  background: "#00D4FF", color: "#0C1624", border: "none",
                  borderRadius: 8, padding: "10px 24px", fontSize: 15,
                  fontWeight: 600, cursor: pinLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 0 12px rgba(0,212,255,0.3)", opacity: pinLoading ? 0.7 : 1
                }}
              >
                {pinLoading ? "Verificando..." : pinModo === 'crear' ? 'Guardar PIN' : 'Ingresar'}
              </button>
              <button
                onClick={() => { setShowPinModal(false); setPendingUsuario(null); }}
                disabled={pinLoading}
                style={{
                  background: "rgba(22,34,56,0.6)", color: "rgba(240,244,248,0.5)", border: "1px solid rgba(0,212,255,0.25)",
                  borderRadius: 8, padding: "10px 20px", fontSize: 15,
                  fontWeight: 500, cursor: pinLoading ? "not-allowed" : "pointer"
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {diagnostico && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(31,38,135,0.18)", zIndex: 10002,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: isLite ? "rgba(22,34,56,0.92)" : "rgba(255,255,255,0.28)", borderRadius: 18,
            boxShadow: isLite ? "0 0 0 1px rgba(0,212,255,0.2)" : "0 8px 32px 0 rgba(31,38,135,0.37)",
            backdropFilter: isLite ? undefined : "blur(12px)", WebkitBackdropFilter: isLite ? undefined : "blur(12px)",
            border: isLite ? "1px solid rgba(0,212,255,0.25)" : "1.5px solid rgba(255,255,255,0.35)",
            padding: "32px 24px", minWidth: 300, maxWidth: 370,
            textAlign: "center", fontFamily: "inherit"
          }}>
            <div style={{ marginBottom: 14 }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ marginBottom: 12, color: "#F5A623", fontWeight: 700, fontSize: 17 }}>
              {diagnostico.titulo}
            </h3>
            <p style={{ color: "rgba(240,244,248,0.65)", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
              Para solucionar el problema, verifica lo siguiente:
            </p>
            <ol style={{ textAlign: "left", color: "rgba(240,244,248,0.85)", fontSize: 13, lineHeight: 1.8, paddingLeft: 20, marginBottom: 20 }}>
              {diagnostico.pasos.map((paso, i) => (
                <li key={i}>{paso}</li>
              ))}
            </ol>
            <button
              className="button"
              onClick={() => setDiagnostico(null)}
              style={{
                background: "#F5A623", color: "#0C1624", border: "none",
                borderRadius: 8, padding: "10px 28px", fontSize: 15,
                fontWeight: 600, cursor: "pointer",
                boxShadow: "0 0 12px rgba(245,166,35,0.4)"
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {isMobile && !isLite && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 70%)" }} />
      )}
    </div>
  );
}

export default CedulaIngreso;
