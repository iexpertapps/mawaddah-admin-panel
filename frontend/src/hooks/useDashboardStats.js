import { useState, useEffect, useCallback } from 'react'
import useAuth from '../context/useAuth'
import api from '../services/api'

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
      const response = await api.get('/api/dashboard/stats/')
      setStats(response.data?.stats || {})
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