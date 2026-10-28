import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, Share, SquarePlus, Smartphone } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Button } from '@/components/ui/Button'

// Pantallas públicas que abren personas ajenas a la organización (firmantes externos,
// enlaces de activación, retorno de OAuth): nunca se les puede exigir instalar la app.
const EXEMPT_PREFIXES = ['/firma/', '/activar', '/auth/callback']
const DISMISS_KEY = 'pwa_gate_dismissed'

/**
 * Pantalla de descarga. Solo en móvil y solo cuando se abre en el navegador
 * (no en modo standalone). Android: botón de instalar. iPhone: instrucciones
 * para "Agregar a pantalla de inicio". Si ya está instalada: aviso para abrirla desde el inicio.
 */
export function PWAInstallGate() {
  const { pathname } = useLocation()
  const { isMobile, isIOS, isInstalled, canInstall, promptChecked, alreadyInstalledElsewhere, promptInstall } =
    usePWAInstall()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  if (!isMobile || isInstalled || dismissed) return null
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const loading = !isIOS && !promptChecked
  // Android sin prompt ni instalación detectada (p. ej. Firefox): sin salida sería un callejón
  const noPrompt = !isIOS && promptChecked && !canInstall && !alreadyInstalledElsewhere

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* sin storage */ }
    setDismissed(true)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[var(--brand)] text-[var(--on-brand)] flex flex-col overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-title"
    >
      <div className="hazard h-4 shrink-0" aria-hidden="true" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-sm mx-auto w-full">
        <img src="/icon-192.png" alt="" width={96} height={96} className="rounded-[26px] border-[4px] border-[#17160F] shadow-[0_14px_30px_-12px_rgba(23,22,15,0.6)]" />

        {loading && (
          <div className="flex flex-col items-center gap-3" aria-live="polite">
            <div className="w-10 h-10 rounded-full border-4 border-[rgba(23,22,15,0.2)] border-t-[#17160F] animate-spin" />
            <p className="font-body font-semibold text-lg">Cargando…</p>
          </div>
        )}

        {!loading && isIOS && (
          <>
            <Heading title="Instala SEÑAL en tu iPhone" text="Agrégala a tu pantalla de inicio para abrirla como una app." />
            <ol className="flex flex-col gap-2.5 w-full list-none p-0 m-0">
              <Step n={1}>Toca <Share className="inline w-5 h-5 -mt-1 mx-0.5" aria-hidden="true" /> <b>Compartir</b> en la barra de Safari</Step>
              <Step n={2}>Desplázate y toca <SquarePlus className="inline w-5 h-5 -mt-1 mx-0.5" aria-hidden="true" /> <b>Agregar a pantalla de inicio</b></Step>
              <Step n={3}>Confirma con <b>Agregar</b>, arriba a la derecha</Step>
            </ol>
            <p className="text-base font-medium opacity-80 text-center">
              Solo funciona en Safari. Si usas otro navegador, abre esta página en Safari.
            </p>
          </>
        )}

        {!loading && canInstall && (
          <>
            <Heading title="Descarga SEÑAL" text="Instálala en tu celular para registrar asistencia y completar inspecciones más rápido, incluso con mala señal." />
            <Button size="lg" className="w-full !bg-[#17160F] !text-[var(--brand)] !shadow-none gap-2" onClick={promptInstall}>
              <Download className="w-6 h-6" aria-hidden="true" />
              Descargar la app
            </Button>
          </>
        )}

        {!loading && alreadyInstalledElsewhere && (
          <>
            <Heading title="SEÑAL ya está instalada" text="Ábrela desde el ícono de tu pantalla de inicio o del cajón de apps para tener la mejor experiencia." />
            <div className="flex items-center gap-3 w-full rounded-[16px] bg-[rgba(23,22,15,0.1)] p-3.5">
              <Smartphone className="w-7 h-7 shrink-0" aria-hidden="true" />
              <p className="m-0 text-base font-medium">Busca el ícono amarillo con la <b>Ñ</b>.</p>
            </div>
          </>
        )}

        {!loading && noPrompt && (
          <Heading title="Instala SEÑAL" text="Abre el menú de tu navegador (⋮) y elige «Instalar aplicación» o «Agregar a pantalla de inicio»." />
        )}

        {!loading && (
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[48px] px-4 font-body font-semibold text-base underline underline-offset-4 decoration-[rgba(23,22,15,0.4)]"
          >
            Continuar en el navegador
          </button>
        )}
      </div>

      <div className="hazard h-4 shrink-0" aria-hidden="true" />
    </div>
  )
}

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="text-center">
      <h2 id="pwa-title" className="font-display font-extrabold text-[40px] leading-[0.95] m-0">{title}</h2>
      <p className="font-body text-lg font-medium mt-3 mb-0 opacity-85">{text}</p>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-[16px] bg-[rgba(23,22,15,0.1)] p-3.5">
      <span className="w-8 h-8 rounded-full bg-[#17160F] text-[var(--brand)] grid place-items-center font-display font-extrabold text-xl shrink-0">{n}</span>
      <span className="font-body text-[17px] leading-snug pt-0.5">{children}</span>
    </li>
  )
}
