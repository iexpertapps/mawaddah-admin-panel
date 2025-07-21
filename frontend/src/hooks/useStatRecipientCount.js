import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export function useStatRecipientCount() {
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
    fetch('/api/appeals/?status=approved', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch approved appeals')
        return res.json()
      })
      .then(json => {
        const appeals = Array.isArray(json) ? json : (json.results || [])
        // Count unique beneficiaries (users who have at least one approved appeal)
        const uniqueRecipientIds = new Set(
          appeals
            .map(appeal => appeal.beneficiary) // Use the beneficiary field from Appeal model
            .filter(Boolean) // Remove null/undefined values
        )
        setData(uniqueRecipientIds.size)
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