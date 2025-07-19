import { renderHook, waitFor } from '@testing-library/react'
import { useStatRecipientCount } from './useStatRecipientCount'

// Mock the useAuth hook
jest.mock('./useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
    isAuthenticated: true
  })
}))

// Mock fetch
global.fetch = jest.fn()

describe('useStatRecipientCount', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('should count unique recipients with approved appeals correctly', async () => {
    // Mock API response with approved appeals from different beneficiaries
    const mockAppeals = [
      { id: 1, beneficiary: 1, status: 'approved', amount_requested: 100 },
      { id: 2, beneficiary: 1, status: 'approved', amount_requested: 200 }, // Same beneficiary
      { id: 3, beneficiary: 2, status: 'approved', amount_requested: 150 }, // Different beneficiary
      { id: 4, beneficiary: 3, status: 'approved', amount_requested: 300 }, // Different beneficiary
    ]

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAppeals
    })

    const { result } = renderHook(() => useStatRecipientCount())

    // Should start with loading state
    expect(result.current.loading).toBe(true)
    expect(result.current.value).toBe(0)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should count 3 unique recipients (beneficiary IDs: 1, 2, 3)
    expect(result.current.value).toBe(3)
    expect(result.current.error).toBe(null)
  })

  it('should handle empty appeals array', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    const { result } = renderHook(() => useStatRecipientCount())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBe(0)
    expect(result.current.error).toBe(null)
  })

  it('should handle API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useStatRecipientCount())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBe(0)
    expect(result.current.error).toBe('Data unavailable')
  })
}) 