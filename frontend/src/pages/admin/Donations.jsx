import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Heading, Text } from '../../components/atoms/typography'
import { Button } from '../../components/atoms'
import StatCard from '../../components/molecules/StatCard'
import AdminLayout from '../../components/layout/AdminLayout'
import useAuth from '../../context/useAuth'
import AdminTable from '../../components/molecules/AdminTable'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/molecules/Modal'
import { formatCurrencyShort } from '../../utils'
import api from '@/services/api'  // ✅ Absolute import alias

/* ----------------------- Error Boundary ----------------------- */
class DonationsErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Donations Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <AdminLayout pageTitle="Donations Error">
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
            <Heading size="xl" className="text-center mb-2">Donations Error</Heading>
            <Text className="text-center mb-6">Something went wrong while loading the donations.</Text>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <CurrencyDollarIcon className="w-5 h-5" />
              Reload Donations
            </Button>
          </div>
        </AdminLayout>
      )
    }
    return this.props.children
  }
}

/* ----------------------- Debounce Hook ----------------------- */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

/* ----------------------- useDonations Hook ----------------------- */
const useDonations = (filters = {}, page = 1, pageSize = 10) => {
  const { token } = useAuth();
  const [data, setData] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const params = {
      page,
      page_size: pageSize,
      ...(filters.search && { search: filters.search }),
      ...(filters.paymentMethod && filters.paymentMethod !== 'all' && { payment_method: filters.paymentMethod }),
      ...(filters.appealLinked === true && { appeal_linked: 'true' }),
      ...(filters.appealLinked === false && { appeal_linked: 'false' }),
    };

    api.get('/api/donations/', { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error('[useDonations] Fetch error', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [token, page, pageSize, JSON.stringify(filters)]);

  return {
    donations: data.results || [],
    totalCount: data.count || 0,
    filteredCount: data.count || 0,
    loading,
    error,
  };
}

/* ----------------------- useDonationStats Hook ----------------------- */
const useDonationStats = (filters = {}, activeFilter = 'all') => {
  const { token } = useAuth();
  const [stats, setStats] = useState({ totalAmount: 0, viaBank: 0, viaJazzCash: 0, viaEasypaisa: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const params = {
      ...(activeFilter === 'bank' && { payment_method: 'bank_transfer' }),
      ...(activeFilter === 'jazzcash' && { payment_method: 'jazzcash' }),
      ...(activeFilter === 'easypaisa' && { payment_method: 'easypaisa' }),
      ...(filters.paymentMethod && filters.paymentMethod !== 'all' && { payment_method: filters.paymentMethod }),
      ...(filters.search && { search: filters.search }),
      ...(filters.appealLinked === true && { appeal_linked: 'true' }),
      ...(filters.appealLinked === false && { appeal_linked: 'false' }),
    };

    api.get('/api/donations/stats/', { params })
      .then((res) => {
        const meta = res.data.meta || {};
        setStats({
          totalAmount: Number(meta.total_amount) || 0,
          viaBank: Number(meta.via_bank) || 0,
          viaJazzCash: Number(meta.via_jazzcash) || 0,
          viaEasypaisa: Number(meta.via_easypaisa) || 0,
        });
      })
      .catch((err) => {
        console.error('[useDonationStats] Fetch error', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [token, activeFilter, JSON.stringify(filters)]);

  return { stats, loading, error };
}

/* ----------------------- Filter Bar ----------------------- */
const DonationFilterBar = React.memo(({ filters, onFiltersChange, activeFilter, onClearFilter }) => {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const debouncedSearch = useDebounce(searchValue, 300)

  useEffect(() => setSearchValue(filters.search || ''), [filters.search])
  useEffect(() => onFiltersChange({ ...filters, search: debouncedSearch }), [debouncedSearch, onFiltersChange])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by donor name or transaction ID"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filters.paymentMethod || 'all'}
              onChange={(e) => onFiltersChange({ ...filters, paymentMethod: e.target.value })}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
            </select>
          </div>

          {/* Appeal Linked Filter */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="appealLinked"
              checked={filters.appealLinked || false}
              onChange={(e) => onFiltersChange({ ...filters, appealLinked: e.target.checked ? true : undefined })}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="appealLinked" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Appeal Linked
            </label>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filters.search || (filters.paymentMethod && filters.paymentMethod !== 'all') || filters.appealLinked !== undefined) && (
          <Button variant="outline" size="sm" onClick={onClearFilter} className="flex items-center gap-2">
            <XMarkIcon className="w-4 h-4" /> Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
})

/* ----------------------- Donations Table ----------------------- */
const DonationsTable = ({ donations, loading, error, onView, totalCount, currentPage, pageSize, onPageChange, onPageSizeChange }) => {
  const columns = [
    { key: 'donor', title: 'Donor', render: (d) => d.donor?.name || 'N/A' },
    { key: 'amount', title: 'Amount', render: (d) => formatCurrencyShort(d.amount) },
    { key: 'payment_method', title: 'Method', render: (d) => d.payment_method },
    { key: 'created_at', title: 'Date', render: (d) => format(new Date(d.created_at), 'dd MMM yyyy') },
    { key: 'appeal', title: 'Appeal Linked', render: (d) => d.appeal 
      ? <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" /> 
      : <XMarkIcon className="w-5 h-5 text-red-400 mx-auto" />
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 relative">
      {loading && <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
        <div className="animate-spin h-5 w-5 border-b-2 border-primary"></div>
      </div>}

      <AdminTable
        columns={columns}
        data={donations.map(d => ({ ...d, key: d.id }))}
        error={error}
        actions={[{
          label: 'View',
          icon: <EyeIcon className="w-5 h-5" />,
          onClick: onView
        }]}
        pagination={{
          page: currentPage,
          pageSize,
          total: totalCount,
          onPageChange
        }}
        pageSizeSelector={(
          <select value={pageSize} onChange={onPageSizeChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        )}
      />
    </div>
  )
}

/* ----------------------- Donations Component ----------------------- */
const Donations = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/unauthorized')
  }, [user, navigate])

  const [filters, setFilters] = useState({ search: '', paymentMethod: 'all', appealLinked: undefined })
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedDonation, setSelectedDonation] = useState(null)

  const { donations, loading, error, totalCount } = useDonations(filters, currentPage, pageSize)
  const { stats, loading: statsLoading, error: statsError } = useDonationStats()

  return (
    <DonationsErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <Heading level={1}>Donations</Heading>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={CurrencyDollarIcon} title="Total Donations" value={stats.totalAmount} loading={statsLoading} error={statsError} />
          <StatCard icon={BanknotesIcon} title="Via Bank" value={stats.viaBank} loading={statsLoading} error={statsError} />
          <StatCard icon={CreditCardIcon} title="Via JazzCash" value={stats.viaJazzCash} loading={statsLoading} error={statsError} />
          <StatCard icon={CreditCardIcon} title="Via Easypaisa" value={stats.viaEasypaisa} loading={statsLoading} error={statsError} />
        </div>

        {/* Filters */}
        <DonationFilterBar
          filters={filters}
          activeFilter={activeFilter}
          onFiltersChange={(f) => { setFilters(f); setCurrentPage(1) }}
          onClearFilter={() => { setFilters({ search: '', paymentMethod: 'all', appealLinked: undefined }); setCurrentPage(1) }}
        />

        {/* Table */}
        <DonationsTable
          donations={donations}
          loading={loading}
          error={error}
          onView={(d) => setSelectedDonation(d)}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(e) => setPageSize(parseInt(e.target.value))}
        />

        {/* Donation Details Modal */}
        <Modal isOpen={!!selectedDonation} onClose={() => setSelectedDonation(null)} title="Donation Details">
          {selectedDonation && (
            <div>
              <Text><strong>Donor:</strong> {selectedDonation.donor?.name || 'N/A'}</Text>
              <Text><strong>Amount:</strong> {formatCurrencyShort(selectedDonation.amount)}</Text>
            </div>
          )}
        </Modal>
      </div>
    </DonationsErrorBoundary>
  )
}

export default Donations
