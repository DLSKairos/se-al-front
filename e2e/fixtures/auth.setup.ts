import { test as setup } from '@playwright/test'
import path from 'path'

const ADMIN_STORAGE = path.resolve('./e2e/.auth/admin.json')
const OPERATOR_STORAGE = path.resolve('./e2e/.auth/operator.json')

setup('autenticar como ADMIN', async ({ page }) => {
  await page.goto('/login')

  // Completar formulario de login con credenciales de ADMIN
  await page.getByLabel(/identificación|usuario|número/i).fill('9876543210')
  await page.getByLabel(/pin|contraseña/i).fill('1234')
  await page.getByRole('button', { name: /ingresar|iniciar sesión|entrar/i }).click()

  // Esperar redirección post-login
  await page.waitForURL(/\/(dashboard|admin|inicio)/, { timeout: 10_000 })

  await page.context().storageState({ path: ADMIN_STORAGE })
})

setup('autenticar como OPERATOR', async ({ page }) => {
  await page.goto('/login')

  // Completar formulario de login con credenciales de OPERATOR
  await page.getByLabel(/identificación|usuario|número/i).fill('1020304050')
  await page.getByLabel(/pin|contraseña/i).fill('5678')
  await page.getByRole('button', { name: /ingresar|iniciar sesión|entrar/i }).click()

  // Esperar redirección post-login
  await page.waitForURL(/\/(dashboard|formularios|inicio)/, { timeout: 10_000 })

  await page.context().storageState({ path: OPERATOR_STORAGE })
})
