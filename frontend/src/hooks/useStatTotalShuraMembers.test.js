import { renderHook, waitFor } from '@testing-library/react'
import { useStatTotalShuraMembers } from './useStatTotalShuraMembers'

// Mock the useAuth hook
jest.mock('./useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
    isAuthenticated: true
  })
}))

// Mock fetch
global.fetch = jest.fn()

describe('useStatTotalShuraMembers', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('should count users with role=shura correctly', async () => {
    // Mock API response with users having different roles
    const mockUsers = [
      { id: 1, email: 'user1@test.com', role: 'shura' },
      { id: 2, email: 'user2@test.com', role: 'donor' },
      { id: 3, email: 'user3@test.com', role: 'shura' },
      { id: 4, email: 'user4@test.com', role: 'recipient' },
      { id: 5, email: 'user5@test.com', role: 'shura' },
    ]

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    })

    const { result } = renderHook(() => useStatTotalShuraMembers())

    // Should start with loading state
    expect(result.current.loading).toBe(true)
    expect(result.current.value).toBe(0)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should count 3 users with role='shura' (user IDs: 1, 3, 5)
    expect(result.current.value).toBe(3)
    expect(result.current.error).toBe(null)
  })

  it('should handle empty users array', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    const { result } = renderHook(() => useStatTotalShuraMembers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBe(0)
    expect(result.current.error).toBe(null)
  })

  it('should handle API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useStatTotalShuraMembers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBe(0)
    expect(result.current.error).toBe('Data unavailable')
  })
}) 