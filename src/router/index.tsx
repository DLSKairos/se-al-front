import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RoleGuard } from './guards/RoleGuard'
import { LoadingSpinner } from '@/components/ui'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { OperatorLayout } from '@/components/layout/OperatorLayout'
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout'

// ── Páginas reales (code splitting) ───────────────────────────────────────────

const LoginPage           = lazy(() => import('@/pages/login/LoginPage'))
const LocationSelectPage  = lazy(() => import('@/pages/operator/LocationSelectPage'))
const OperatorHomePage    = lazy(() => import('@/pages/operator/OperatorHomePage'))
const FillFormPage        = lazy(() => import('@/pages/operator/FillFormPage'))
const AttendancePage      = lazy(() => import('@/pages/operator/AttendancePage'))
const OperatorProfilePage = lazy(() => import('@/pages/operator/OperatorProfilePage'))

// ── Páginas admin ─────────────────────────────────────────────────────────────

const AdminDashboardPage      = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminChatPage           = lazy(() => import('@/pages/admin/AdminChatPage'))
const FormTemplatesListPage   = lazy(() => import('@/pages/admin/FormTemplatesListPage'))
const FormTemplateBuilderPage = lazy(() => import('@/pages/admin/FormTemplateBuilderPage'))
const FormSubmissionsPage     = lazy(() => import('@/pages/admin/FormSubmissionsPage'))
const SubmissionDetailPage    = lazy(() => import('@/pages/admin/SubmissionDetailPage'))
const UsersPage               = lazy(() => import('@/pages/admin/UsersPage'))
const WorkLocationsPage       = lazy(() => import('@/pages/admin/WorkLocationsPage'))
const DepartmentsPage         = lazy(() => import('@/pages/admin/DepartmentsPage'))
const CategoriesPage          = lazy(() => import('@/pages/admin/CategoriesPage'))
const AttendanceAdminPage     = lazy(() => import('@/pages/admin/AttendanceAdminPage'))
const AttendanceConfigPage    = lazy(() => import('@/pages/admin/AttendanceConfigPage'))
const OrgSettingsPage         = lazy(() => import('@/pages/admin/OrgSettingsPage'))
const WebhooksPage            = lazy(() => import('@/pages/admin/WebhooksPage'))
const PushTestPage            = lazy(() => import('@/pages/admin/PushTestPage'))

// ── Páginas super admin ───────────────────────────────────────────────────────

const OrganizationsPage = lazy(() => import('@/pages/super/OrganizationsPage'))
const CreateOrgPage     = lazy(() => import('@/pages/super/CreateOrgPage'))
const OrgDetailPage     = lazy(() => import('@/pages/super/OrgDetailPage'))

// ── Placeholder para rutas pendientes ─────────────────────────────────────────

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-[var(--navy)]">
    <p className="text-[var(--off-white)] text-xl font-['DM_Sans']">{name} — en construcción</p>
  </div>
)

// ── Router ────────────────────────────────────────────────────────────────────

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingSpinner fullscreen />}>
      <Routes>

        {/* ── Pública ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Location Select (todos los roles autenticados) ── */}
        <Route element={<RoleGuard allowedRoles={['OPERATOR', 'ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/location-select" element={<LocationSelectPage />} />
        </Route>

        {/* ── Operario ── */}
        <Route element={<RoleGuard allowedRoles={['OPERATOR']} />}>
          <Route path="/" element={<OperatorLayout />}>
            <Route index element={<OperatorHomePage />} />
            <Route path="form/:templateId" element={<FillFormPage />} />
            <Route path="asistencia" element={<AttendancePage />} />
            <Route path="perfil" element={<OperatorProfilePage />} />
          </Route>
          <Route path="/game/rotate-screen" element={<Placeholder name="RotateScreen" />} />
          <Route path="/game/story-intro" element={<Placeholder name="StoryIntro" />} />
          <Route path="/game/world-map" element={<Placeholder name="WorldMap" />} />
          <Route path="/game/level/:templateId" element={<Placeholder name="LevelWrapper" />} />
        </Route>

        {/* ── Administrador ── */}
        <Route element={<RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="formularios" element={<FormTemplatesListPage />} />
            <Route path="formularios/nuevo" element={<FormTemplateBuilderPage />} />
            <Route path="formularios/:templateId/editar" element={<FormTemplateBuilderPage />} />
            <Route path="formularios/:templateId/submissions" element={<FormSubmissionsPage />} />
            <Route path="submissions/:id" element={<SubmissionDetailPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="ubicaciones" element={<WorkLocationsPage />} />
            <Route path="departamentos" element={<DepartmentsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="asistencia" element={<AttendanceAdminPage />} />
            <Route path="asistencia/configuracion" element={<AttendanceConfigPage />} />
            <Route path="configuracion" element={<OrgSettingsPage />} />
            <Route path="configuracion/webhooks" element={<WebhooksPage />} />
            <Route path="configuracion/notificaciones-push" element={<PushTestPage />} />
          </Route>
        </Route>

        {/* ── Super Admin ── */}
        <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/super" element={<SuperAdminLayout />}>
            <Route index element={<OrganizationsPage />} />
            <Route path="organizaciones/nueva" element={<CreateOrgPage />} />
            <Route path="organizaciones/:id" element={<OrgDetailPage />} />
          </Route>
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Suspense>
  )
}
