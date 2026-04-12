const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Registra una suscripción Web Push para el trabajador indicado y la persiste
 * en el backend mediante POST /push/subscribe.
 *
 * Obtiene la clave pública VAPID desde /vapid-public-key, crea una suscripción
 * con PushManager y la envía al backend. Todos los errores se capturan
 * internamente para que el flujo de autenticación nunca se interrumpa por un
 * fallo en la suscripción push.
 *
 * @param {string} numeroIdentificacion - Número de identificación del trabajador usado como clave de suscriptor.
 * @returns {Promise<void>}
 */
export async function subscribeUser(numeroIdentificacion) {
  try {
    const vapidKeyRes = await fetch(`${API_BASE_URL}/vapid-public-key`);
    if (!vapidKeyRes.ok) throw new Error("No se pudo obtener la clave VAPID");
    const vapidPublicKey = await vapidKeyRes.text();

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    const payload = {
      numero_identificacion: numeroIdentificacion,
      subscription: typeof subscription.toJSON === "function" ? subscription.toJSON() : subscription
    };

    const resp = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error("No se pudo registrar la suscripción push");
  } catch {
    // La suscripción push no es crítica; los errores se silencian intencionalmente.
  }
}

/**
 * Convierte una clave VAPID codificada en base64 segura para URL a un Uint8Array,
 * tal como lo requiere PushManager.subscribe().
 *
 * @param {string} base64String - Clave pública VAPID codificada en base64 segura para URL.
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
