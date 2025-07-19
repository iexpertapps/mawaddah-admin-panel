import { renderHook, waitFor } from '@testing-library/react'
import { useStatTotalDonors } from './useStatTotalDonors'

// Mock the useAuth hook
jest.mock('./useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
    isAuthenticated: true
  })
}))

// Mock fetch
global.fetch = jest.fn()

describe('useStatTotalDonors', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('should count unique donors correctly', async () => {
    // Mock API response with donations from different donors
    const mockDonations = [
      { id: 1, donor: 1, amount: 100 },
      { id: 2, donor: 1, amount: 200 }, // Same donor
      { id: 3, donor: 2, amount: 150 }, // Different donor
      { id: 4, donor: 3, amount: 300 }, // Different donor
    ]

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDonations
    })

    const { result } = renderHook(() => useStatTotalDonors())

    // Should start with loading state
    expect(result.current.loading).toBe(true)
    expect(result.current.value).toBe(0)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should count 3 unique donors (donor IDs: 1, 2, 3)
    expect(result.current.value).toBe(3)
    expect(result.current.error).toBe(null)
  })

  it('should handle empty donations array', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    const { result } = renderHook(() => useStatTotalDonors())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBe(0)
    expect(result.current.error).toBe(null)
  })

  it('should handle API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useStatTotalDonors())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBe(0)
    expect(result.current.error).toBe('Data unavailable')
  })
}) 