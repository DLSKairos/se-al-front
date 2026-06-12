import { useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

/**
 * Ruta pública: /auth/callback
 *
 * El backend OAuth redirige aquí tras el handshake con Google/Microsoft.
 * El token JWT llega en el fragment (#token=JWT&activated=1) para evitar
 * que quede en los logs del servidor. Los errores siguen llegando como
 * query params (?error=...).
 *
 * Flujo:
 *  1. Lee `token` primero desde el hash, con fallback al query param (compatibilidad)
 *  2. Si `token` presente → setToken → redirigir según rol del JWT
 *  3. Si `error=not_registered` → /login con state de error legible
 *  4. Cualquier otro error → /login con mensaje genérico
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const setToken = useAuthStore((s) => s.setToken)

  useEffect(() => {
    // El token llega en el fragment (#token=JWT) para no exponerlo en server logs.
    // Fallback al query param para compatibilidad con redirecciones antiguas.
    const hashParams = new URLSearchParams(location.hash.slice(1))
    const token = hashParams.get('token') ?? searchParams.get('token')

    // Los errores siempre llegan por query param
    const error = searchParams.get('error')

    if (token) {
      // Registrar el JWT en el store (también decodifica el payload)
      setToken(token)
      const user = useAuthStore.getState().user
      const role: UserRole | undefined = user?.role

      if (role === 'SUPER_ADMIN') {
        navigate('/super', { replace: true })
      } else if (role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        // Rol inesperado para OAuth (los operarios no usan OAuth)
        navigate('/login', { replace: true })
      }
      return
    }

    if (error === 'not_registered') {
      navigate('/login', {
        replace: true,
        state: {
          oauthError: 'Esta cuenta no está registrada como administrador en SEÑAL.',
        },
      })
      return
    }

    // Error genérico
    navigate('/login', {
      replace: true,
      state: {
        oauthError: 'No se pudo completar el ingreso con la cuenta seleccionada. Intenta de nuevo.',
      },
    })
  }, [location.hash, location.search, searchParams, navigate, setToken])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#0C1624' }}
      aria-label="Verificando ingreso"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <div
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ background: '#00D4FF' }}
        />
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.5rem',
            letterSpacing: '0.15em',
            color: '#F0F4F8',
          }}
        >
          SEÑAL
        </span>
      </div>

      {/* Indicador de carga */}
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              background: '#00D4FF',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.875rem',
          color: 'rgba(240,244,248,0.6)',
        }}
      >
        Verificando tu información…
      </p>
    </div>
  )
}
