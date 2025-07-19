import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

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
    fetch('/api/wallet/stats/', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch wallet stats')
        return res.json()
      })
      .then(json => {
        setData({
          totalWithdrawals: json.total_withdrawals || 0,
          approvedWithdrawals: json.approved_withdrawals || 0,
          pendingWithdrawals: json.pending_withdrawals || 0,
          transactions: json.transactions || [],
          count: json.count || 0
        })
      })
      .catch(() => setError('Data unavailable'))
      .finally(() => setLoading(false))
  }, [token])

  return { 
    data: data ?? {
      totalWithdrawals: 0,
      approvedWithdrawals: 0,
      pendingWithdrawals: 0,
      transactions: [],
      count: 0
    }, 
    loading, 
    error 
  }
} 