import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import api from '../services/api'

export function useWalletStats() {
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
    api.get('/api/wallet/stats/')
      .then(res => {
        setData(res.data)
      })
      .catch(() => setError('Data unavailable'))
      .finally(() => setLoading(false))
  }, [token])

  return {
    data: data ?? { total_balance: 0, activity: [] },
    loading,
    error,
    value: data ?? { total_balance: 0, activity: [] }
  }
} 