/**
 * formParser.ts — Envía datos de formulario al backend.
 * Los campos vienen de la API, por lo que no hay config hardcodeada.
 */
import api from '@/lib/api'

export interface SubmitFormParams {
  templateId: string
  values: Record<string, unknown>
  workLocationId?: string
  geoLat?: number
  geoLng?: number
}

/**
 * Envía las respuestas del formulario al backend y retorna el ID de la submission.
 */
export async function submitFormData({
  templateId,
  values,
  workLocationId,
  geoLat,
  geoLng,
}: SubmitFormParams): Promise<string> {
  const response = await api.post<{ id: string }>('/form-submissions', {
    template_id:      templateId,
    work_location_id: workLocationId ?? null,
    values,
    ...(geoLat !== undefined && geoLng !== undefined
      ? { geo_lat: geoLat, geo_lng: geoLng }
      : {}),
  })
  return response.data.id
}
