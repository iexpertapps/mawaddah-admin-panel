import { useState, useEffect } from 'react'
import useAuth from '../context/useAuth'
import api from '../services/api'

export function useStatTotalUsers() {
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
    api.get('/api/users/')
      .then(res => {
        const count = Array.isArray(res.data) ? res.data.length : (res.data.count || 0)
        setData(count)
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