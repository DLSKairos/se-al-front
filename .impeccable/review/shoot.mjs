// Uso: node shoot.mjs <theme: light|dark> <role: OPERATOR|ADMIN|none> <width> <name> <path> [--prep=js]
import { chromium } from '/Users/davidlamp/dev/señal/se-al-front/node_modules/playwright-core/index.mjs'

const [theme = 'light', role = 'OPERATOR', width = '390', name = 'shot', path = '/'] = process.argv.slice(2)
const w = Number(width)
const mobile = w < 700
const out = `/Users/davidlamp/dev/señal/se-al-front/.impeccable/review/${name}.png`

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64')
const now = Math.floor(Date.now() / 1000)
const jwt = `x.${b64({ sub: 'u1', orgId: 'org1', orgName: 'Constructora Andina', role, jobTitle: 'Oficial de obra', iat: now, exp: now + 86400 })}.y`

const templates = [
  { id: 't1', name: 'Inspección de andamios', description: 'Revisión diaria de andamios y plataformas', icon: '🏗️', status: 'ACTIVE', data_frequency: 'DAILY', fields: [{ id: 'f1', label: '¿Los andamios están anclados?', key: 'a', type: 'BOOLEAN', required: true, order: 1, options: null }, { id: 'f2', label: 'Observaciones', key: 'b', type: 'TEXT', required: false, order: 2, options: null }] },
  { id: 't2', name: 'Permiso de trabajo en alturas', description: 'Obligatorio sobre 1,5 m', icon: '🦺', status: 'ACTIVE', data_frequency: 'DAILY', fields: [{ id: 'f3', label: '¿Usa arnés certificado?', key: 'c', type: 'BOOLEAN', required: true, order: 1, options: null }] },
  { id: 't3', name: 'Charla de seguridad', description: 'Charla de cinco minutos antes del turno', icon: '📣', status: 'ACTIVE', data_frequency: 'WEEKLY', fields: [] },
  { id: 't4', name: 'Inventario de herramientas', description: null, icon: '🧰', status: 'ACTIVE', data_frequency: 'MONTHLY', fields: [] },
  { id: 't5', name: 'Revisión de extintores', description: 'Estado y fecha de recarga', icon: '🧯', status: 'ACTIVE', data_frequency: 'MONTHLY', fields: [] },
]
const locations = [
  { id: 'l1', name: 'Torre Central — Fase 2', address: 'Cra 7 # 71-21, Bogotá', latitude: 4.65, longitude: -74.05, radius: 300, is_active: true },
  { id: 'l2', name: 'Túnel La Línea', address: 'Calarcá, Quindío', latitude: 4.5, longitude: -75.6, radius: 500, is_active: true },
]
const attendance = { id: 'a1', entry_time: new Date(Date.now() - 3 * 3600e3).toISOString(), exit_time: null, total_minutes: null }

const routes = [
  [/\/status\/user-context/, { id: 'u1', name: 'Carlos Pérez', role, org_id: 'org1', org_name: 'Constructora Andina', work_location_id: 'l1', work_location_name: 'Torre Central — Fase 2' }],
  [/form-submissions\/context\/t\d/, { template: templates[0], is_readonly: false }],
  [/\/form-templates\/t\d/, templates[0]],
  [/\/form-templates/, templates],
  [/\/attendance\/today/, attendance],
  [/\/attendance\/config/, { id: 'c', require_gps: true }],
  [/\/work-locations/, locations],
  [/\/notifications.*unread|unread-count/, { count: 3 }],
  [/\/notifications/, { items: [], total: 0, data: [] }],
  [/\/feature-flags|\/features/, {}],
  [/form-submissions\/stats/, { total_users: 42, active_users: 31, total_submissions: 128, by_status: { SUBMITTED: 14, PENDING_SIGNATURES: 6, APPROVED: 101, REJECTED: 7, DRAFT: 0 }, trend: [{month:'Jun',submissions:30,unique_users:20},{month:'Jul',submissions:44,unique_users:25},{month:'Ago',submissions:54,unique_users:31}], by_template: [{template_id:'t1',name:'Inspección de andamios',count:60},{template_id:'t2',name:'Permiso de alturas',count:41}], recent: [{id:'1',submitted_by:'Carlos Pérez',template_name:'Inspección de andamios',work_location:'Torre Central',submitted_at:new Date().toISOString(),status:'APPROVED'},{id:'2',submitted_by:'Ana Ruiz',template_name:'Permiso de alturas',work_location:'Túnel La Línea',submitted_at:new Date().toISOString(),status:'REJECTED'}] }],
  [/\/submissions\/stats|\/dashboard/, { total: 128, pending: 14, approved: 101, rejected: 13, today: 9 }],
]

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({
  viewport: { width: w, height: mobile ? 844 : 900 },
  deviceScaleFactor: 2,
  colorScheme: theme === 'dark' ? 'dark' : 'light',
  ignoreHTTPSErrors: true,
  hasTouch: mobile,
  isMobile: mobile,
})
await ctx.addInitScript(([jwt, role, theme, lite]) => {
  if (lite) sessionStorage.setItem('lite_mode', 'true')
  if (role !== 'none') {
    localStorage.setItem('senal-auth', JSON.stringify({ state: { token: jwt, user: JSON.parse(atob(jwt.split('.')[1])), workLocationId: 'l1' }, version: 0 }))
  }
  localStorage.setItem('intro_shown_' + new Date().toISOString().slice(0, 10), '1')
  localStorage.setItem('nombre_trabajador', 'Carlos')
  sessionStorage.setItem('lite_banner_dismissed', '1')
  window.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.theme = theme })
}, [jwt, role, theme, process.argv.includes('--lite')])

await ctx.route(/\/api\//, async (route) => {
  const url = route.request().url()
  for (const [re, data] of routes) if (re.test(url)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) })
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
})

const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text().slice(0, 200)) })
await page.goto('https://localhost:4000' + path, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '*{animation-duration:0.01ms!important;animation-delay:0s!important;transition-duration:0.01ms!important}' })
const prep = process.argv.find((a) => a.startsWith('--prep='))
if (prep) { await page.evaluate(`(async()=>{${prep.slice(7)}})()`); }
await page.waitForTimeout(900)
await page.screenshot({ path: out, fullPage: process.argv.includes('--full') })
console.log('saved', out, errors.length ? '\n' + errors.slice(0, 6).join('\n') : '')
await browser.close()
