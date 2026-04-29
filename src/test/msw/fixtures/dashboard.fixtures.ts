import type { DashboardStats } from '@/types'

export const dashboardStatsFixture: DashboardStats = {
  total_users: 25,
  active_users: 22,
  total_submissions: 348,
  by_status: {
    DRAFT: 12,
    SUBMITTED: 180,
    APPROVED: 140,
    REJECTED: 16,
  },
  trend: [
    { month: '2024-01', submissions: 45, unique_users: 12 },
    { month: '2024-02', submissions: 60, unique_users: 15 },
    { month: '2024-03', submissions: 72, unique_users: 18 },
    { month: '2024-04', submissions: 80, unique_users: 20 },
    { month: '2024-05', submissions: 91, unique_users: 21 },
  ],
  by_template: [
    { template_id: 'template-001', name: 'Inspección de Equipos', count: 150 },
    { template_id: 'template-003', name: 'Reporte de Incidente', count: 95 },
    { template_id: 'template-002', name: 'Permiso de Trabajo en Altura', count: 103 },
  ],
  recent: [
    {
      id: 'sub-001',
      submitted_by: 'Carlos Mendoza',
      template_name: 'Inspección de Equipos',
      work_location: 'Planta Norte',
      submitted_at: '2024-05-15T09:30:00.000Z',
      status: 'SUBMITTED',
    },
    {
      id: 'sub-002',
      submitted_by: 'Carlos Mendoza',
      template_name: 'Reporte de Incidente',
      work_location: 'Planta Norte',
      submitted_at: '2024-05-14T14:00:00.000Z',
      status: 'APPROVED',
    },
    {
      id: 'sub-003',
      submitted_by: 'Carlos Mendoza',
      template_name: 'Permiso de Trabajo en Altura',
      work_location: 'Planta Norte',
      submitted_at: '2024-05-13T07:45:00.000Z',
      status: 'REJECTED',
    },
  ],
}
