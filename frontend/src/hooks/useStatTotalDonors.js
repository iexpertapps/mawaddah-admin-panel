import { useState, useEffect } from 'react'
import useAuth from '../context/useAuth'
import api from '../services/api'

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
    api.get('/api/donations/')
      .then(res => {
        const donations = Array.isArray(res.data) ? res.data : (res.data.results || [])
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