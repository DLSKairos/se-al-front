import api from '@/lib/api'

// ── Helpers de conversión ─────────────────────────────────────────────────────

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  let b64 = base64.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const binary = atob(b64)
  const buf = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return view
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// ── Error tipado ──────────────────────────────────────────────────────────────

export type WebAuthnErrorCode =
  | 'NOT_SUPPORTED'
  | 'USER_CANCELLED'
  | 'NO_CREDENTIALS'
  | 'INVALID_STATE'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN'
  | 'NO_RESPONSE'

export class WebAuthnError extends Error {
  code: WebAuthnErrorCode

  constructor(message: string, code: WebAuthnErrorCode) {
    super(message)
    this.name = 'WebAuthnError'
    this.code = code
  }
}

// ── Tipos internos de las respuestas del backend ──────────────────────────────

interface RegisterBeginResponse {
  challenge: string
  user: { id: string; name: string; displayName: string }
  excludeCredentials?: Array<{ id: string; type: string; transports?: string[] }>
  [key: string]: unknown
}

interface AuthBeginResponse {
  challenge: string
  allowCredentials?: Array<{ id: string; type: string; transports?: string[] }>
  [key: string]: unknown
}

interface AuthFinishResponse {
  access_token: string
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Retorna true si el dispositivo expone un autenticador de plataforma con
 * verificación de usuario (huella dactilar, Face ID, etc.).
 */
export async function checkWebAuthnSupport(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/**
 * Registra una nueva credencial WebAuthn (passkey) para el usuario indicado.
 * Retorna true si el registro fue exitoso.
 */
export async function registerWebAuthn(userId: string): Promise<boolean> {
  // 1. Obtener opciones de registro
  const beginRes = await api.post<RegisterBeginResponse>(
    '/auth/webauthn/register/begin',
    { user_id: userId },
  )
  const options = beginRes.data as RegisterBeginResponse

  if (!options.challenge) {
    throw new WebAuthnError('El campo challenge no existe en las opciones de registro', 'PARSE_ERROR')
  }
  if (!options.user?.id) {
    throw new WebAuthnError('El campo user.id no existe en las opciones de registro', 'PARSE_ERROR')
  }

  // 2. Decodificar buffers
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    ...(options as unknown as PublicKeyCredentialCreationOptions),
    challenge: base64ToUint8Array(options.challenge),
    user: {
      ...(options.user as unknown as PublicKeyCredentialUserEntity),
      id: base64ToUint8Array(options.user.id),
    },
    excludeCredentials: options.excludeCredentials?.map((c) => ({
      id: base64ToUint8Array(c.id),
      type: c.type as PublicKeyCredentialType,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
  }

  // 3. Invocar autenticador
  const credential = (await navigator.credentials.create({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential | null

  if (!credential) {
    throw new WebAuthnError('No se recibió credencial del autenticador', 'NO_RESPONSE')
  }

  const attestationResp = credential.response as AuthenticatorAttestationResponse

  const attestationResponse = {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64Url(attestationResp.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(attestationResp.attestationObject),
    },
    type: credential.type,
  }

  // 4. Verificar con backend
  await api.post('/auth/webauthn/register/finish', {
    user_id: userId,
    attestationResponse,
  })

  return true
}

/**
 * Registra biometría de primer uso usando identification_number (sin JWT).
 * Retorna el access_token tras el registro exitoso, dejando al usuario autenticado.
 */
export async function registerWebAuthnPublic(identificationNumber: string): Promise<string> {
  // 1. Obtener opciones de registro
  let options: RegisterBeginResponse
  try {
    const res = await api.post<RegisterBeginResponse>(
      '/auth/webauthn/register-init/begin',
      { identification_number: identificationNumber },
    )
    options = res.data
  } catch (e: unknown) {
    throw new WebAuthnError('Error al iniciar registro biométrico', 'NETWORK_ERROR')
  }

  if (!options.challenge || !options.user?.id) {
    throw new WebAuthnError('Opciones de registro inválidas', 'PARSE_ERROR')
  }

  // 2. Decodificar buffers
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    ...(options as unknown as PublicKeyCredentialCreationOptions),
    challenge: base64ToUint8Array(options.challenge),
    user: {
      ...(options.user as unknown as PublicKeyCredentialUserEntity),
      id: base64ToUint8Array(options.user.id),
    },
    excludeCredentials: [],
  }

  // 3. Invocar autenticador
  let credential: PublicKeyCredential | null
  try {
    credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null
  } catch (e) {
    const err = e as DOMException
    if (err.name === 'NotAllowedError') {
      throw new WebAuthnError('Cancelaste el registro biométrico', 'USER_CANCELLED')
    }
    throw new WebAuthnError('Error durante el registro biométrico', 'UNKNOWN')
  }

  if (!credential) {
    throw new WebAuthnError('No se recibió credencial del autenticador', 'NO_RESPONSE')
  }

  const attestationResp = credential.response as AuthenticatorAttestationResponse

  const attestationResponse = {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64Url(attestationResp.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(attestationResp.attestationObject),
    },
    type: credential.type,
  }

  // 4. Verificar con backend y obtener token
  const finishRes = await api.post<{ access_token: string }>(
    '/auth/webauthn/register-init/finish',
    { identification_number: identificationNumber, attestationResponse },
  )

  return finishRes.data.access_token
}

/**
 * Autentica al usuario usando su credencial WebAuthn registrada.
 * Retorna el access_token si la autenticación fue exitosa.
 * Lanza WebAuthnError con código tipado en cada ruta de fallo.
 */
export async function authenticateWebAuthn(userId: string): Promise<string> {
  // 1. Obtener opciones de autenticación
  let options: AuthBeginResponse
  try {
    const res = await api.post<AuthBeginResponse>('/auth/webauthn/login/begin', {
      identification_number: userId,
    })
    options = res.data
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 400) {
      throw new WebAuthnError('Sin credenciales WebAuthn registradas', 'NO_CREDENTIALS')
    }
    throw new WebAuthnError(
      'Error de conexión al obtener opciones de autenticación',
      'NETWORK_ERROR',
    )
  }

  // 2. Decodificar buffers
  let publicKeyOptions: PublicKeyCredentialRequestOptions
  try {
    publicKeyOptions = {
      ...(options as unknown as PublicKeyCredentialRequestOptions),
      challenge: base64ToUint8Array(options.challenge),
      allowCredentials: options.allowCredentials?.map((c) => ({
        id: base64ToUint8Array(c.id),
        type: c.type as PublicKeyCredentialType,
        transports: c.transports as AuthenticatorTransport[] | undefined,
      })),
    }
  } catch {
    throw new WebAuthnError('Error procesando opciones de autenticación', 'PARSE_ERROR')
  }

  // 3. Invocar autenticador
  let assertion: PublicKeyCredential | null
  try {
    assertion = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null
  } catch (e) {
    const err = e as DOMException
    const msg = err.message?.toLowerCase() ?? ''

    const userCancelled =
      msg.includes('cancel') ||
      msg.includes('abort') ||
      msg.includes('dismissed') ||
      msg.includes('user gesture') ||
      msg.includes('not focused')

    if (err.name === 'NotAllowedError') {
      if (userCancelled) {
        throw new WebAuthnError('Cancelaste la autenticación', 'USER_CANCELLED')
      }
      throw new WebAuthnError(
        'No hay llaves de acceso disponibles en este dispositivo',
        'NO_CREDENTIALS',
      )
    }
    if (err.name === 'InvalidStateError') {
      throw new WebAuthnError('Estado inválido de autenticación', 'INVALID_STATE')
    }
    if (err.name === 'SecurityError') {
      throw new WebAuthnError('Error de seguridad: origen no permitido', 'UNKNOWN')
    }
    throw new WebAuthnError('Error durante la autenticación biométrica', 'UNKNOWN')
  }

  if (!assertion) {
    throw new WebAuthnError('No se recibió respuesta de autenticación', 'NO_RESPONSE')
  }

  const assertionResp = assertion.response as AuthenticatorAssertionResponse

  const assertionResponse = {
    id: assertion.id,
    rawId: arrayBufferToBase64Url(assertion.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64Url(assertionResp.clientDataJSON),
      authenticatorData: arrayBufferToBase64Url(assertionResp.authenticatorData),
      signature: arrayBufferToBase64Url(assertionResp.signature),
      userHandle: assertionResp.userHandle
        ? arrayBufferToBase64Url(assertionResp.userHandle)
        : null,
    },
    type: assertion.type,
  }

  // 4. Verificar con backend y obtener token
  const finishRes = await api.post<AuthFinishResponse>('/auth/webauthn/login/finish', {
    identification_number: userId,
    assertionResponse,
  })

  return finishRes.data.access_token
}
