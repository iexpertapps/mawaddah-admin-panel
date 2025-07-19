import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://mawaddahapp.up.railway.app';

export const useDashboardStats = () => {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStats = useCallback(async () => {
    if (!token) {
      setError('No authentication token found')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setStats(data?.stats || {})
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStats()
    // Optionally, add polling here if needed
  }, [fetchStats])

  return { 
    stats: stats ?? {}, 
    loading, 
    error, 
    refetch: fetchStats, 
    lastUpdated 
  }
} 