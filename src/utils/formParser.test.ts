import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mockPost exists before the vi.mock factory runs
const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  registerTokenHelpers: vi.fn(),
  default: {
    post: mockPost,
  },
}))

import { submitFormData } from './formParser'

describe('submitFormData', () => {
  beforeEach(() => {
    mockPost.mockReset()
  })

  it('should call api.post with /form-submissions and the correct body', async () => {
    mockPost.mockResolvedValue({ data: { id: 'sub-001' } })

    await submitFormData({
      templateId: 'template-001',
      values: { estado_equipo: 'bueno' },
      workLocationId: 'loc-001',
      geoLat: 4.711,
      geoLng: -74.0721,
    })

    expect(mockPost).toHaveBeenCalledOnce()
    expect(mockPost).toHaveBeenCalledWith('/form-submissions', {
      template_id: 'template-001',
      work_location_id: 'loc-001',
      values: { estado_equipo: 'bueno' },
      geo_lat: 4.711,
      geo_lng: -74.0721,
    })
  })

  it('should return the submission ID from the response', async () => {
    mockPost.mockResolvedValue({ data: { id: 'sub-abc-123' } })

    const id = await submitFormData({
      templateId: 'template-001',
      values: {},
    })

    expect(id).toBe('sub-abc-123')
  })

  it('should include geo_lat and geo_lng only when both are provided', async () => {
    mockPost.mockResolvedValue({ data: { id: 'sub-geo' } })

    await submitFormData({
      templateId: 'template-001',
      values: {},
      geoLat: 6.2442,
      geoLng: -75.5812,
    })

    const [, body] = mockPost.mock.calls[0]
    expect(body).toHaveProperty('geo_lat', 6.2442)
    expect(body).toHaveProperty('geo_lng', -75.5812)
  })

  it('should omit geo_lat and geo_lng when they are not provided', async () => {
    mockPost.mockResolvedValue({ data: { id: 'sub-no-geo' } })

    await submitFormData({
      templateId: 'template-001',
      values: { campo: 'valor' },
      workLocationId: 'loc-001',
    })

    const [, body] = mockPost.mock.calls[0]
    expect(body).not.toHaveProperty('geo_lat')
    expect(body).not.toHaveProperty('geo_lng')
  })

  it('should send work_location_id as null when workLocationId is not provided', async () => {
    mockPost.mockResolvedValue({ data: { id: 'sub-null-loc' } })

    await submitFormData({
      templateId: 'template-001',
      values: {},
    })

    const [, body] = mockPost.mock.calls[0]
    expect(body.work_location_id).toBeNull()
  })

  it('should propagate errors thrown by api.post', async () => {
    mockPost.mockRejectedValue(new Error('Network Error'))

    await expect(
      submitFormData({
        templateId: 'template-001',
        values: {},
      })
    ).rejects.toThrow('Network Error')
  })
})
