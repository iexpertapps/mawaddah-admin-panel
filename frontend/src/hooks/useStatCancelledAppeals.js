import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

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
    fetch('/api/appeals/', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch appeals')
        return res.json()
      })
      .then(json => {
        const appeals = Array.isArray(json) ? json : (json.results || [])
        const cancelledAppeals = appeals.filter(appeal => appeal.status === 'cancelled' || appeal.is_cancelled)
        setData(cancelledAppeals.length)
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