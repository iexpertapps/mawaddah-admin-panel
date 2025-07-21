import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export function useStatCancelledAppeals() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) {
      setError('No authentication token found')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    api.get('/api/appeals/')
      .then(res => {
        const appeals = Array.isArray(res.data) ? res.data : (res.data.results || [])
        // Count cancelled appeals
        const cancelledCount = appeals.filter(appeal => appeal.status === 'cancelled').length
        setData(cancelledCount)
      })
      .catch(() => setError('Data unavailable'))
      .finally(() => setLoading(false))
  }, [token])

  return {
    data: data ?? 0,
    loading,
    error,
    value: data ?? 0
  }
} 