import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function useStatTotalShuraMembers() {
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
    fetch('/api/users/?role=shura', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch shura members')
        return res.json()
      })
      .then(json => {
        const users = Array.isArray(json) ? json : (json.results || [])
        // Count users with role='shura'
        const shuraMembers = users.filter(user => user.role === 'shura')
        setData(shuraMembers.length)
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