import { useState, useEffect, useCallback } from 'react'
import useAuth from '../context/useAuth'
import api from '../services/api' // centralized axios instance

export const useAppeals = (filters = {}, page = 1, pageSize = 25) => {
  const { token } = useAuth()
  const [data, setData] = useState({
    results: [],
    count: 0,
    next: null,
    previous: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [filteredStats, setFilteredStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  })
  const [globalStats, setGlobalStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    cancelled: 0,
    fulfilled: 0,
    expired: 0,
  })

  // Fetch global stats once
  const fetchGlobalStats = useCallback(async () => {
    if (!token) return
    try {
      const { data: stats } = await api.get('/api/appeals/stats/')
      setGlobalStats(stats)
    } catch (err) {
      console.error('[useAppeals] Global stats fetch error:', err)
    }
  }, [token])

  // Fetch appeals with filters
  const fetchAppeals = useCallback(
    async (newFilters = filters, newPage = page) => {
      if (!token) return
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: newPage.toString(),
          page_size: pageSize.toString(),
        })
        if (newFilters.search) params.append('search', newFilters.search)
        if (newFilters.status && newFilters.status !== 'all')
          params.append('status', newFilters.status)
        if (newFilters.type && newFilters.type !== 'all')
          params.append('category', newFilters.type)

        const { data: json } = await api.get(`/api/appeals/`, { params })

        setData(json)

        // Use filtered stats from backend response or fallback
        const filteredStats = json.filtered_stats || {
          total: json.count || 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          fulfilled: 0,
          expired: 0,
        }
        setFilteredStats(filteredStats)
        setLoading(false)
      } catch (err) {
        console.error('[useAppeals] Fetch error:', err)
        setError(err)
        setLoading(false)
      }
    },
    [token, pageSize]
  )

  // Update appeals (approve, reject, cancel)
  const updateAppeal = useCallback(
    async (appealId, status, rejectionReason = null) => {
      if (!token) return
      setLoading(true)
      setError(null)

      try {
        const payload = { status }
        if (rejectionReason) payload.rejection_reason = rejectionReason

        await api.patch(`/api/appeals/${appealId}/`, payload)

        // Refresh the appeals list and global stats
        await fetchAppeals(filters, page)
        await fetchGlobalStats()
        return true
      } catch (err) {
        console.error(`[useAppeals] ${status} error:`, err)
        setError(err)
        setLoading(false)
        return false
      }
    },
    [token, filters, page, fetchAppeals, fetchGlobalStats]
  )

  // Convenience methods for actions
  const approveAppeal = useCallback(
    (appealId) => updateAppeal(appealId, 'approved'),
    [updateAppeal]
  )
  const rejectAppeal = useCallback(
    (appealId, reason) => updateAppeal(appealId, 'rejected', reason),
    [updateAppeal]
  )
  const cancelAppeal = useCallback(
    (appealId) => updateAppeal(appealId, 'cancelled'),
    [updateAppeal]
  )

  // Initial load
  useEffect(() => {
    if (!token) return
    if (isInitialLoad) {
      setLoading(true)
      setIsInitialLoad(false)
      fetchGlobalStats()
    }
    fetchAppeals(filters, page)
  }, [
    token,
    page,
    JSON.stringify(filters),
    isInitialLoad,
    fetchAppeals,
    fetchGlobalStats,
  ])

  return {
    appeals: data.results || [],
    loading,
    error,
    totalCount: data.count || 0,
    filteredCount: data.count || 0,
    filteredStats, // dynamic stats for filtered table
    globalStats, // global stats for stat cards
    fetchAppeals,
    approveAppeal,
    rejectAppeal,
    cancelAppeal,
    updateAppeal,
  }
}
