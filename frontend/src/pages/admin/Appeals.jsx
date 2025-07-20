import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { Heading, Text } from '../../components/atoms/typography'
import { Button } from '../../components/atoms'
import StatCard from '../../components/molecules/StatCard'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuth } from '../../hooks/useAuth'
import { useAppeals } from '../../hooks/useAppeals'
import AdminTable from '../../components/molecules/AdminTable'
import Modal from '../../components/molecules/Modal'
import { SkeletonTable, SkeletonStats } from '../../components/atoms/Skeleton'
import { format, formatDistanceToNow } from 'date-fns'

// Currency formatting utility
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '0'
  const num = Number(value)
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "k"
  return num.toLocaleString()
}

// Error Boundary Component
class AppealsErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Appeals Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <AdminLayout pageTitle="Appeals Error">
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
            <Heading size="xl" className="text-center mb-2">Appeals Error</Heading>
            <Text className="text-center mb-6">Something went wrong while loading the appeals.</Text>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
              Reload Appeals
            </Button>
          </div>
        </AdminLayout>
      )
    }

    return this.props.children
  }
}

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Enhanced Stat Card with active filter highlighting
const EnhancedStatCard = ({ 
  icon, 
  title, 
  value, 
  loading, 
  error, 
  highlight, 
  onClick, 
  color = 'primary',
  isActive = false 
}) => {
  // Remove highlight effects - maintain visual calm and consistency
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      <StatCard
        title={title}
        value={value}
        icon={icon}
        loading={loading}
        error={error}
        color={color}
        onClick={onClick}
        clickable={!!onClick}
        // Remove highlight classes - maintain clean appearance
        className="min-h-[120px]" // Lock height to prevent layout shift
      />
    </motion.div>
  )
}

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }) => {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <Text>{message}</Text>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {cancelText || 'Cancel'}
          </Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm}
          >
            {confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Appeal Details Modal
const AppealDetailsModal = ({ appeal, isOpen, onClose, onApprove, onReject, onCancel, loading }) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return format(new Date(dateString), 'dd MMM yyyy')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'Pending', icon: ClockIcon },
      approved: { color: 'green', text: 'Approved', icon: CheckCircleIcon },
      rejected: { color: 'red', text: 'Rejected', icon: XCircleIcon },
      cancelled: { color: 'gray', text: 'Cancelled', icon: XCircleIcon },
      fulfilled: { color: 'green', text: 'Fulfilled', icon: CheckCircleIcon },
      expired: { color: 'gray', text: 'Expired', icon: XCircleIcon },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${config.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
        ${config.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
        ${config.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
        ${config.color === 'gray' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' : ''}
      `}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
  }

  const getFulfillmentDisplay = (appeal) => {
    if (!appeal.is_fulfilled) return '—'
    
    if (appeal.fulfillment_source === 'donor') {
      return `Donor: ${appeal.linked_donation_donor_name || 'Unknown'}`
    } else if (appeal.fulfillment_source === 'platform') {
      return 'Via Platform'
    }
    
    return '—'
  }

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(appeal.id, rejectionReason.trim())
      setShowRejectDialog(false)
      setRejectionReason('')
    }
  }

  if (!appeal) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Appeal Details">
        <div className="space-y-6">
          {/* Appeal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">Appeal ID</Text>
              <Text className="font-medium">#{appeal.id}</Text>
            </div>
            <div>
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">Status</Text>
              {getStatusBadge(appeal.status)}
            </div>
            <div>
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">User</Text>
              <Text className="font-medium">{appeal.user_name || appeal.beneficiary_name || 'Unknown'}</Text>
            </div>
            <div>
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">Type</Text>
              <Text className="font-medium capitalize">{appeal.category?.replace('_', ' ') || '—'}</Text>
            </div>
            <div className="col-span-2">
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">Purpose</Text>
              <Text className="font-medium">{appeal.description || 'No description provided'}</Text>
            </div>
            <div>
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">Amount</Text>
              <Text className="font-medium">PKR {formatCurrency(appeal.amount_requested)}</Text>
            </div>
            <div>
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">Monthly</Text>
              <Text className="font-medium">{appeal.is_monthly ? 'Yes' : 'No'}</Text>
            </div>
            <div className="col-span-2">
              <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-1">Fulfillment</Text>
              <Text className="font-medium">{getFulfillmentDisplay(appeal)}</Text>
            </div>
          </div>

          {/* Admin Actions History */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Text size="sm" className="text-gray-500 dark:text-gray-400 mb-3 font-medium">Admin Actions History</Text>
            <div className="space-y-3">
              {appeal.approved_by_name && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <Text size="sm" className="font-medium text-green-800 dark:text-green-200">Approved</Text>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Text size="xs" className="text-gray-500 dark:text-gray-400">By:</Text>
                      <Text size="sm" className="font-medium">{appeal.approved_by_name}</Text>
                    </div>
                    {appeal.approved_at && (
                      <div>
                        <Text size="xs" className="text-gray-500 dark:text-gray-400">On:</Text>
                        <Text size="sm" className="font-medium">{formatDate(appeal.approved_at)}</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {appeal.rejected_by_name && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <Text size="sm" className="font-medium text-red-800 dark:text-red-200">Rejected</Text>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Text size="xs" className="text-gray-500 dark:text-gray-400">By:</Text>
                      <Text size="sm" className="font-medium">{appeal.rejected_by_name}</Text>
                    </div>
                    {appeal.rejected_at && (
                      <div>
                        <Text size="xs" className="text-gray-500 dark:text-gray-400">On:</Text>
                        <Text size="sm" className="font-medium">{formatDate(appeal.rejected_at)}</Text>
                      </div>
                    )}
                  </div>
                  {appeal.rejection_reason && (
                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                      <Text size="xs" className="text-gray-500 dark:text-gray-400 mb-1">Reason:</Text>
                      <Text size="sm" className="font-medium">{appeal.rejection_reason}</Text>
                    </div>
                  )}
                </div>
              )}
              
              {appeal.cancelled_by_name && (
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircleIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <Text size="sm" className="font-medium text-gray-800 dark:text-gray-200">Cancelled</Text>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Text size="xs" className="text-gray-500 dark:text-gray-400">By:</Text>
                      <Text size="sm" className="font-medium">{appeal.cancelled_by_name}</Text>
                    </div>
                    {appeal.cancelled_at && (
                      <div>
                        <Text size="xs" className="text-gray-500 dark:text-gray-400">On:</Text>
                        <Text size="sm" className="font-medium">{formatDate(appeal.cancelled_at)}</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!appeal.approved_by_name && !appeal.rejected_by_name && !appeal.cancelled_by_name && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <Text size="sm" className="font-medium text-yellow-800 dark:text-yellow-200">No admin actions yet</Text>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {appeal.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                onClick={() => onApprove(appeal.id)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Reject
              </Button>
              <Button
                variant="secondary"
                onClick={() => onCancel(appeal.id)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Rejection Dialog */}
      <ConfirmationDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        title="Reject Appeal"
        message="Please provide a reason for rejecting this appeal:"
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
      >
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </ConfirmationDialog>
    </>
  )
}

// Appeals Table Component with smooth animations
const AppealsTable = ({ appeals, loading, error, onView, onApprove, onReject, totalCount, currentPage, pageSize, onPageChange, onPageSizeChange }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return format(new Date(dateString), 'dd MMM yyyy')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'Pending', icon: ClockIcon },
      approved: { color: 'green', text: 'Approved', icon: CheckCircleIcon },
      rejected: { color: 'red', text: 'Rejected', icon: XCircleIcon },
      cancelled: { color: 'gray', text: 'Cancelled', icon: XCircleIcon },
      fulfilled: { color: 'green', text: 'Fulfilled', icon: CheckCircleIcon },
      expired: { color: 'gray', text: 'Expired', icon: XCircleIcon },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${config.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
        ${config.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
        ${config.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
        ${config.color === 'gray' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' : ''}
      `}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
  }

  const getFulfillmentDisplay = (appeal) => {
    if (!appeal.is_fulfilled) return '—'
    
    if (appeal.fulfillment_source === 'donor') {
      return `Donor: ${appeal.linked_donation_donor_name || 'Unknown'}`
    } else if (appeal.fulfillment_source === 'platform') {
      return 'Via Platform'
    }
    
    return '—'
  }

  const columns = [
    {
      key: 'id',
      title: 'Appeal ID',
      minWidth: 100,
      render: (appeal) => `#${appeal.id}`
    },
    {
      key: 'user_name',
      title: 'User',
      minWidth: 150,
      render: (appeal) => appeal.user_name || appeal.beneficiary_name || 'Unknown'
    },
    {
      key: 'category',
      title: 'Type',
      minWidth: 120,
      render: (appeal) => appeal.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '—'
    },
    {
      key: 'description',
      title: 'Purpose',
      minWidth: 200,
      render: (appeal) => (
        <div className="max-w-xs">
          <Text size="sm" className="line-clamp-2 text-left">
            {appeal.description || 'No description'}
          </Text>
        </div>
      )
    },
    {
      key: 'amount_requested',
      title: 'Amount',
      minWidth: 120,
      render: (appeal) => `PKR ${formatCurrency(appeal.amount_requested)}`
    },
    {
      key: 'status',
      title: 'Status',
      minWidth: 120,
      render: (appeal) => getStatusBadge(appeal.status)
    },
    {
      key: 'approved_by_name',
      title: 'Approved By',
      minWidth: 140,
      render: (appeal) => appeal.approved_by_name || '—'
    },
    {
      key: 'rejected_by_name',
      title: 'Rejected By',
      minWidth: 140,
      render: (appeal) => appeal.rejected_by_name || '—'
    },
    {
      key: 'cancelled_by_name',
      title: 'Cancelled By',
      minWidth: 140,
      render: (appeal) => appeal.cancelled_by_name || '—'
    },
    {
      key: 'fulfillment',
      title: 'Fulfillment',
      minWidth: 150,
      render: (appeal) => getFulfillmentDisplay(appeal)
    },
    {
      key: 'created_at',
      title: 'Created At',
      minWidth: 120,
      render: (appeal) => formatDate(appeal.created_at)
    }
  ]

  const actions = [
    {
      label: 'View',
      icon: <EyeIcon className="w-4 h-4" />,
      onClick: onView,
      color: 'secondary'
    },
    // Add inline action buttons for pending appeals
    ...(appeals.some(a => a.status === 'pending') ? [
      {
        label: 'Approve',
        icon: <CheckIcon className="w-4 h-4" />,
        onClick: (appeal) => appeal.status === 'pending' ? onApprove(appeal.id) : null,
        color: 'primary',
        condition: (appeal) => appeal.status === 'pending'
      },
      {
        label: 'Reject',
        icon: <XMarkIcon className="w-4 h-4" />,
        onClick: (appeal) => appeal.status === 'pending' ? onReject(appeal.id) : null,
        color: 'danger',
        condition: (appeal) => appeal.status === 'pending'
      }
    ] : [])
  ]

  const pagination = {
    page: currentPage,
    pageSize,
    total: totalCount,
    onPageChange
  }

  const pageSizeSelector = (
    <select
      value={pageSize}
      onChange={(e) => onPageSizeChange(Number(e.target.value))}
      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
    >
      <option value={10}>10 per page</option>
      <option value={25}>25 per page</option>
      <option value={50}>50 per page</option>
    </select>
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <AdminTable
        columns={columns}
        data={appeals}
        loading={loading}
        error={error}
        emptyState="No appeals found."
        errorState="Failed to load appeals."
        actions={actions}
        pagination={pagination}
        pageSizeSelector={pageSizeSelector}
      />
    </motion.div>
  )
}

// Main Appeals Component with enhanced UX
const Appeals = () => {
  const { user } = useAuth()
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedAppeal, setSelectedAppeal] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    appeals,
    loading,
    error,
    totalCount,
    filteredStats,
    approveAppeal,
    rejectAppeal,
    cancelAppeal,
    globalStats
  } = useAppeals({ ...filters, search: debouncedSearch }, currentPage, pageSize)

  const handleViewAppeal = useCallback((appeal) => {
    setSelectedAppeal(appeal)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedAppeal(null)
  }, [])

  const handleApprove = useCallback(async (appealId) => {
    setActionLoading(true)
    const success = await approveAppeal(appealId)
    if (success) {
      handleCloseModal()
    }
    setActionLoading(false)
  }, [approveAppeal, handleCloseModal])

  const handleReject = useCallback(async (appealId, reason) => {
    setActionLoading(true)
    const success = await rejectAppeal(appealId, reason)
    if (success) {
      handleCloseModal()
    }
    setActionLoading(false)
  }, [rejectAppeal, handleCloseModal])

  const handleCancel = useCallback(async (appealId) => {
    setActionLoading(true)
    const success = await cancelAppeal(appealId)
    if (success) {
      handleCloseModal()
    }
    setActionLoading(false)
  }, [cancelAppeal, handleCloseModal])

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }, [])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  // Handle stat card clicks with smooth transitions
  const handleStatClick = useCallback((status) => {
    if (status === 'all') {
      handleFilterChange('status', 'all')
    } else {
      handleFilterChange('status', status)
    }
  }, [handleFilterChange])

  // Use filtered stats from the hook for dynamic updates
  const stats = useMemo(() => {
    return filteredStats
  }, [filteredStats])

  // Determine active filter for highlighting
  const activeFilter = filters.status === 'all' ? 'all' : filters.status

  return (
    <AppealsErrorBoundary>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div>
            <Heading size="xl">Appeals</Heading>
            <Text className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and review user appeals
            </Text>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards with smooth animations */}
        <div className="flex flex-wrap gap-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap gap-4 w-full"
              >
                <SkeletonStats />
              </motion.div>
            ) : (
              <motion.div
                key="stats-loaded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap gap-4 w-full"
              >
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <EnhancedStatCard
                    title="Total Appeals"
                    value={globalStats.total}
                    icon={<ExclamationTriangleIcon className="w-6 h-6" />}
                    loading={loading}
                    onClick={() => handleStatClick('all')}
                    isActive={activeFilter === 'all'}
                  />
                </div>
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <EnhancedStatCard
                    title="Pending"
                    value={globalStats.pending}
                    icon={<ClockIcon className="w-6 h-6" />}
                    loading={loading}
                    color="yellow"
                    onClick={() => handleStatClick('pending')}
                    isActive={activeFilter === 'pending'}
                  />
                </div>
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <EnhancedStatCard
                    title="Approved"
                    value={globalStats.approved}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    loading={loading}
                    color="green"
                    onClick={() => handleStatClick('approved')}
                    isActive={activeFilter === 'approved'}
                  />
                </div>
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <EnhancedStatCard
                    title="Rejected"
                    value={globalStats.rejected}
                    icon={<XCircleIcon className="w-6 h-6" />}
                    loading={loading}
                    color="red"
                    onClick={() => handleStatClick('rejected')}
                    isActive={activeFilter === 'rejected'}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Filters with smooth transitions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search appeals..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="sm:w-48">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="house_rent">House Rent</option>
                <option value="school_fee">School Fee</option>
                <option value="medical">Medical</option>
                <option value="utility_bills">Utility Bills</option>
                <option value="debt">Debt</option>
                <option value="business_support">Business Support</option>
                <option value="death_support">Death Support</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(filters.search !== '' || filters.status !== 'all' || filters.type !== 'all') && (
              <div className="sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFilters({
                      search: '',
                      status: 'all',
                      type: 'all'
                    })
                    setCurrentPage(1)
                  }}
                  className="w-full sm:w-auto h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-center gap-x-1.5 text-center hover:text-gray-700 dark:hover:text-gray-50 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear Filters</span>
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Appeals Table with smooth animations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <SkeletonTable />
              </motion.div>
            ) : (
              <motion.div
                key="table-loaded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AppealsTable
                  appeals={appeals}
                  loading={loading}
                  error={error}
                  onView={handleViewAppeal}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  totalCount={totalCount}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Appeal Details Modal */}
        <AppealDetailsModal
          appeal={selectedAppeal}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleCancel}
          loading={actionLoading}
        />
      </motion.div>
    </AppealsErrorBoundary>
  )
}

export default Appeals 