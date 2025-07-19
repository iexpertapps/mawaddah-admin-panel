import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function useStatTotalDonors() {
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
    fetch('/api/donations/', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch donations')
        return res.json()
      })
      .then(json => {
        const donations = Array.isArray(json) ? json : (json.results || [])
        // Count unique donors (users who have made at least one donation)
        const uniqueDonorIds = new Set(
          donations
            .map(donation => donation.donor) // Use the donor field from Donation model
            .filter(Boolean) // Remove null/undefined values
        )
        setData(uniqueDonorIds.size)
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