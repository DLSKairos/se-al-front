import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { registerLogoutCallback } from './lib/api'
import { AppRouter } from './router'
import { ToastProvider } from './components/ui/Toast'

// Limpiar caché de React Query en cada logout / 401
registerLogoutCallback(() => queryClient.clear())

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
