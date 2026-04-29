import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { AIAssistPanel } from './AIAssistPanel'
import { useFormEditorStore } from '@/stores/formEditorStore'

// La URL que axios usa en tests — viene de VITE_API_URL en .env.local
const AI_ASSIST_URL = 'https://localhost:3000/api/form-ai/assist'

// ── Mock framer-motion — evita problemas con AnimatePresence en jsdom ──────────

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) => (
      <aside {...props}>{children}</aside>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useFormEditorStore.getState().reset()
})

// ── Helper ─────────────────────────────────────────────────────────────────────

function renderPanel(isOpen = true) {
  const onClose = vi.fn()
  const result = renderWithProviders(<AIAssistPanel isOpen={isOpen} onClose={onClose} />)
  return { ...result, onClose }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AIAssistPanel', () => {
  it('muestra el panel cuando isOpen=true', () => {
    renderPanel(true)
    expect(screen.getByRole('complementary', { name: /panel de asistente ia/i })).toBeInTheDocument()
  })

  it('no muestra el panel cuando isOpen=false', () => {
    renderPanel(false)
    expect(screen.queryByRole('complementary', { name: /panel de asistente ia/i })).not.toBeInTheDocument()
  })

  it('muestra el mensaje inicial de bienvenida de SEÑALIA', () => {
    renderPanel()
    expect(screen.getByText(/soy señalia/i)).toBeInTheDocument()
  })

  it('el textarea de instrucción es visible y editable', async () => {
    renderPanel()
    const textarea = screen.getByLabelText('Instrucción para la IA')
    expect(textarea).toBeInTheDocument()
    await userEvent.type(textarea, 'Agrega una sección de seguridad')
    expect(textarea).toHaveValue('Agrega una sección de seguridad')
  })

  it('el botón de enviar está deshabilitado cuando el input está vacío', () => {
    renderPanel()
    expect(screen.getByLabelText('Enviar instrucción')).toBeDisabled()
  })

  it('el botón de enviar se habilita cuando hay texto en el input', async () => {
    renderPanel()
    await userEvent.type(screen.getByLabelText('Instrucción para la IA'), 'Hola')
    expect(screen.getByLabelText('Enviar instrucción')).not.toBeDisabled()
  })

  it('al enviar deshabilita el textarea mientras procesa (estado loading)', async () => {
    // Usamos una promise que no se resuelve hasta que la controlemos
    let resolveFetch!: () => void
    const pendingFetch = new Promise<void>((res) => { resolveFetch = res })

    server.use(
      http.post(AI_ASSIST_URL, async () => {
        await pendingFetch
        return HttpResponse.json({
          success: true,
          data: { action: 'none', payload: null, message: 'Sin cambios' },
        })
      })
    )

    renderPanel()
    const textarea = screen.getByLabelText('Instrucción para la IA')
    await userEvent.type(textarea, 'Test de carga')

    // Click en enviar — la request queda pendiente
    await userEvent.click(screen.getByLabelText('Enviar instrucción'))

    // Mientras la request está en vuelo, el textarea debe estar deshabilitado
    expect(textarea).toBeDisabled()
    // Y el indicador de carga debe estar visible
    expect(screen.getByText('Procesando...')).toBeInTheDocument()

    // Resolvemos la request para no dejar promesas colgadas
    resolveFetch()
    await waitFor(() => expect(textarea).not.toBeDisabled())
  })

  it('el mensaje del usuario aparece en el chat después de enviar', async () => {
    renderPanel()
    const textarea = screen.getByLabelText('Instrucción para la IA')
    await userEvent.type(textarea, 'Agregar campo de nombre')
    await userEvent.click(screen.getByLabelText('Enviar instrucción'))

    expect(screen.getByText('Agregar campo de nombre')).toBeInTheDocument()
  })

  it('la respuesta de la IA aparece en el panel después de la request', async () => {
    server.use(
      http.post(AI_ASSIST_URL, () =>
        HttpResponse.json({
          success: true,
          data: { action: 'none', payload: null, message: 'Entendido, formulario revisado.' },
        })
      )
    )

    renderPanel()
    await userEvent.type(screen.getByLabelText('Instrucción para la IA'), 'Revisa el formulario')
    await userEvent.click(screen.getByLabelText('Enviar instrucción'))

    await waitFor(() => {
      expect(screen.getByText('Entendido, formulario revisado.')).toBeInTheDocument()
    })
  })

  it('el input se limpia después de enviar', async () => {
    renderPanel()
    const textarea = screen.getByLabelText('Instrucción para la IA')
    await userEvent.type(textarea, 'Instrucción de prueba')
    await userEvent.click(screen.getByLabelText('Enviar instrucción'))

    expect(textarea).toHaveValue('')
  })

  it('muestra mensaje de error cuando el endpoint falla', async () => {
    server.use(
      http.post(AI_ASSIST_URL, () =>
        HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
      )
    )

    renderPanel()
    await userEvent.type(screen.getByLabelText('Instrucción para la IA'), 'Instrucción que falla')
    await userEvent.click(screen.getByLabelText('Enviar instrucción'))

    await waitFor(() => {
      expect(screen.getByText(/no pude procesar tu solicitud/i)).toBeInTheDocument()
    })
  })

  it('llama a onClose cuando se hace click en el botón Cerrar', async () => {
    const { onClose } = renderPanel()
    await userEvent.click(screen.getByLabelText('Cerrar panel de IA'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('al pulsar Enter en el textarea envía el mensaje', async () => {
    renderPanel()
    const textarea = screen.getByLabelText('Instrucción para la IA')
    await userEvent.type(textarea, 'Mensaje con Enter')
    await userEvent.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('Mensaje con Enter')).toBeInTheDocument()
    })
  })

  it('aplica update_sections al store cuando la IA responde con esa acción', async () => {
    const newSections = [
      { id: 'ai-sec-1', name: 'Sección IA', hasObservations: false, fields: [] },
    ]

    server.use(
      http.post(AI_ASSIST_URL, () =>
        HttpResponse.json({
          success: true,
          data: {
            action: 'update_sections',
            payload: { sections: newSections },
            message: 'Secciones actualizadas.',
          },
        })
      )
    )

    renderPanel()
    await userEvent.type(screen.getByLabelText('Instrucción para la IA'), 'Reorganizar secciones')
    await userEvent.click(screen.getByLabelText('Enviar instrucción'))

    await waitFor(() => {
      const storeSections = useFormEditorStore.getState().state.sections
      expect(storeSections).toHaveLength(1)
      expect(storeSections[0].name).toBe('Sección IA')
    })
  })
})
