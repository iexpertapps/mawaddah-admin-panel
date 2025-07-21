import { useState, useEffect } from 'react'
import useAuth from '../context/useAuth'
import api from '../services/api'

export function useStatTotalDonationAmount() {
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
        // Sum all donation amounts
        const totalAmount = donations.reduce((sum, donation) => sum + (parseFloat(donation.amount) || 0), 0)
        setData(totalAmount)
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