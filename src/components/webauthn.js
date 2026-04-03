const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Retorna true si el dispositivo expone un autenticador de plataforma con
 * verificación de usuario (huella dactilar, Face ID, etc.) a través de la API WebAuthn.
 *
 * @returns {Promise<boolean>}
 */
export async function checkWebAuthnSupport() {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Convierte una cadena en base64 o base64url a un Uint8Array.
 *
 * @param {string} base64 - Cadena codificada en base64 o base64url.
 * @returns {Uint8Array}
 * @throws {Error} Si la entrada no puede decodificarse.
 */
function base64ToUint8Array(base64) {
  let b64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/**
 * Convierte un ArrayBuffer a una cadena en base64.
 *
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Registra una nueva credencial WebAuthn (passkey) para el trabajador indicado.
 *
 * Obtiene las opciones de registro desde /webauthn/register/options, invoca
 * navigator.credentials.create() y verifica la attestation con
 * /webauthn/register/verify.
 *
 * @param {{ numero_identificacion: string, nombre: string }} params
 * @returns {Promise<object>} Respuesta de verificación del backend.
 * @throws {WebAuthnError} En caso de cancelación o error a nivel de dispositivo.
 */
export async function registerWebAuthn({ numero_identificacion, nombre }) {
  let options;
  try {
    const res = await fetch(`${API_BASE_URL}/webauthn/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_identificacion, nombre })
    });
    options = await res.json();
  } catch (e) {
    throw e;
  }

  try {
    if (!options.challenge) {
      throw new Error('El campo challenge no existe en las opciones de registro');
    }
    if (!options.user || !options.user.id) {
      throw new Error('El campo user.id no existe en las opciones de registro');
    }
    options.challenge = base64ToUint8Array(options.challenge);
    options.user.id = base64ToUint8Array(options.user.id);
    if (options.excludeCredentials) {
      options.excludeCredentials = options.excludeCredentials.map(c => ({
        ...c,
        id: base64ToUint8Array(c.id)
      }));
    }

    const credential = await navigator.credentials.create({ publicKey: options });

    const attestationResponse = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64(credential.response.attestationObject)
      },
      type: credential.type
    };

    const verifyRes = await fetch(`${API_BASE_URL}/webauthn/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_identificacion, attestationResponse })
    });
    return await verifyRes.json();
  } catch (e) {
    throw e;
  }
}

/**
 * Clase de error personalizada para operaciones WebAuthn.
 *
 * Códigos de error:
 *   NOT_SUPPORTED  - El dispositivo no tiene autenticador de plataforma.
 *   USER_CANCELLED - El usuario cerró el prompt biométrico.
 *   NO_CREDENTIALS - La credencial fue registrada en otro dispositivo.
 *   INVALID_STATE  - El autenticador está en un estado inválido.
 *   NETWORK_ERROR  - El backend no es alcanzable.
 *   PARSE_ERROR    - No se pudo interpretar la respuesta del backend.
 *   UNKNOWN        - Error no clasificado.
 *   NO_RESPONSE    - navigator.credentials.get retornó null.
 */
export class WebAuthnError extends Error {
  /**
   * @param {string} message
   * @param {string} code - Uno de los códigos documentados arriba.
   */
  constructor(message, code) {
    super(message);
    this.name = 'WebAuthnError';
    this.code = code;
  }
}

/**
 * Autentica al trabajador usando su credencial WebAuthn registrada.
 *
 * Obtiene las opciones de autenticación desde /webauthn/authenticate/options,
 * invoca navigator.credentials.get() y verifica la assertion con
 * /webauthn/authenticate/verify.
 *
 * @param {{ numero_identificacion: string }} params
 * @returns {Promise<object>} Respuesta de verificación del backend.
 * @throws {WebAuthnError} Con código tipado en cada ruta de fallo.
 */
export async function authenticateWebAuthn({ numero_identificacion }) {
  let options;
  try {
    const res = await fetch(`${API_BASE_URL}/webauthn/authenticate/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_identificacion })
    });
    options = await res.json();
  } catch {
    throw new WebAuthnError('Error de conexión al obtener opciones de autenticación', 'NETWORK_ERROR');
  }

  try {
    options.challenge = base64ToUint8Array(options.challenge);
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map(c => ({
        ...c,
        id: base64ToUint8Array(c.id)
      }));
    }
  } catch {
    throw new WebAuthnError('Error procesando opciones de autenticación', 'PARSE_ERROR');
  }

  let assertion;
  try {
    assertion = await navigator.credentials.get({ publicKey: options });
  } catch (e) {
    const errorMsg = e.message?.toLowerCase() || '';
    const errorName = e.name || '';

    const usuarioCancelo = errorMsg.includes('cancel') || errorMsg.includes('abort') ||
      errorMsg.includes('dismissed') || errorMsg.includes('user gesture') ||
      errorMsg.includes('not focused');

    if (errorName === 'NotAllowedError') {
      if (usuarioCancelo) {
        throw new WebAuthnError('Cancelaste la autenticación', 'USER_CANCELLED');
      }
      throw new WebAuthnError('No hay llaves de acceso disponibles en este dispositivo', 'NO_CREDENTIALS');
    }

    if (errorName === 'InvalidStateError') {
      throw new WebAuthnError('Estado inválido de autenticación', 'INVALID_STATE');
    }

    if (errorName === 'SecurityError') {
      throw new WebAuthnError('Error de seguridad: origen no permitido', 'UNKNOWN');
    }

    throw new WebAuthnError('Error durante la autenticación biométrica', 'UNKNOWN');
  }

  if (!assertion) {
    throw new WebAuthnError('No se recibió respuesta de autenticación', 'NO_RESPONSE');
  }

  const assertionResponse = {
    id: assertion.id,
    rawId: arrayBufferToBase64(assertion.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
      authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
      signature: arrayBufferToBase64(assertion.response.signature),
      userHandle: assertion.response.userHandle ? arrayBufferToBase64(assertion.response.userHandle) : null
    },
    type: assertion.type
  };

  const verifyRes = await fetch(`${API_BASE_URL}/webauthn/authenticate/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero_identificacion, assertionResponse })
  });
  return await verifyRes.json();
}
