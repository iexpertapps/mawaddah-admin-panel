import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export function useStatAppealsByShura() {
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
        // Count appeals by status
        const total = appeals.length
        const approved = appeals.filter(appeal => appeal.status === 'approved').length
        const pending = appeals.filter(appeal => appeal.status === 'pending').length
        const rejected = appeals.filter(appeal => appeal.status === 'rejected').length
        
        setData({
          total,
          approved,
          pending,
          rejected
        })
      })
      .catch(() => setError('Data unavailable'))
      .finally(() => setLoading(false))
  }, [token])

  return {
    data: data ?? { total: 0, approved: 0, pending: 0, rejected: 0 },
    loading,
    error,
    value: data ?? { total: 0, approved: 0, pending: 0, rejected: 0 }
  }
} 