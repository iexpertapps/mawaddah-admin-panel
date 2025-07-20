import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
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
import { useAuth } from '../../hooks/useAuth'
import AdminTable from '../../components/molecules/AdminTable'
import { format, formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import Drawer from '../../components/molecules/Drawer'
import Modal from '../../components/molecules/Modal'
import { formatCurrencyShort, formatCurrency } from '../../utils'

// Error Boundary Component
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

// Loading Skeleton for Table
const TableLoadingSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
    <div className="space-y-4">
      <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    </div>
  </div>
)

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

// Enhanced useDonations hook with stable caching and dynamic filtering
const useDonations = (filters = {}, page = 1, pageSize = 10) => {
  const { token } = useAuth();
  const [data, setData] = useState({
    results: [],
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    // Only show loading on initial load, not on filter changes
    if (isInitialLoad) {
      setLoading(true);
      setIsInitialLoad(false);
    }
    
    setError(null);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (filters.search) params.append('search', filters.search);
    if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('payment_method', filters.paymentMethod);
    if (filters.appealLinked === true) params.append('appeal_linked', 'true');
    else if (filters.appealLinked === false) params.append('appeal_linked', 'false');
    const url = `/api/donations/?${params.toString()}`;
    fetch(url, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch donations')
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useDonations] Fetch error', err);
        setError(err);
        setLoading(false);
      });
  }, [token, page, pageSize, JSON.stringify(filters), isInitialLoad]);
  
  return { 
    donations: data.results || [], 
    loading, 
    error, 
    totalCount: data.count || 0, 
    filteredCount: data.count || 0 
  };
};

// Enhanced useDonationStats hook with filtered counts
const useDonationStats = (filters = {}, activeFilter = 'all') => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalAmount: 0,
    viaBank: 0,
    viaJazzCash: 0,
    viaEasypaisa: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    
    // Build query params for stats - don't include pagination
    const params = new URLSearchParams();
    if (activeFilter === 'bank') params.append('payment_method', 'bank_transfer');
    else if (activeFilter === 'jazzcash') params.append('payment_method', 'jazzcash');
    else if (activeFilter === 'easypaisa') params.append('payment_method', 'easypaisa');
    else if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('payment_method', filters.paymentMethod);
    if (filters.search) params.append('search', filters.search);
    if (filters.appealLinked === true) params.append('appeal_linked', 'true');
    else if (filters.appealLinked === false) params.append('appeal_linked', 'false');
    
    const url = `/api/donations/?${params.toString()}`;
    fetch(url, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch donation stats')
        return res.json();
      })
      .then((json) => {
        const meta = json.meta || {};
        setStats({
          totalAmount: Number(meta.total_amount) || 0,
          viaBank: Number(meta.via_bank) || 0,
          viaJazzCash: Number(meta.via_jazzcash) || 0,
          viaEasypaisa: Number(meta.via_easypaisa) || 0,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useDonationStats] Fetch error', err);
        setError(err);
        setLoading(false);
      });
  }, [token, activeFilter, JSON.stringify(filters)]);
  return { stats, loading, error };
};

// Enhanced Filter Bar with Clear Filter button
const DonationFilterBar = React.memo(({ filters, onFiltersChange, activeFilter, onClearFilter }) => {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const debouncedSearch = useDebounce(searchValue, 300)

  // Sync searchValue with filters.search when filters change externally
  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  useEffect(() => {
    onFiltersChange({ ...filters, search: debouncedSearch })
  }, [debouncedSearch, onFiltersChange])

  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value)
  }, [])

  const handlePaymentMethodChange = useCallback((e) => {
    onFiltersChange({ ...filters, paymentMethod: e.target.value })
  }, [filters, onFiltersChange])

  const handleAppealLinkedChange = useCallback((e) => {
    onFiltersChange({ 
      ...filters, 
      appealLinked: e.target.checked ? true : undefined 
    })
  }, [filters, onFiltersChange])

  // Only show Clear Filter if any filter is not at its default value (ignore activeFilter)
  const hasActiveFilters = useMemo(() => (
    (filters.search && filters.search.trim() !== '') ||
    (filters.paymentMethod && filters.paymentMethod !== 'all') ||
    filters.appealLinked !== undefined ||
    filters.dateFrom ||
    filters.dateTo
  ), [filters])

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
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filters.paymentMethod || 'all'}
              onChange={handlePaymentMethodChange}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none bg-white dark:bg-gray-700"
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
              onChange={handleAppealLinkedChange}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="appealLinked" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Appeal Linked
            </label>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilter}
            className="flex items-center gap-2"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
})

// Enhanced Stat Card with currency formatting
const EnhancedStatCard = ({ icon, title, value, loading, error, onClick }) => {
  // Format the value for display
  const formatValue = (val) => {
    if (typeof val === 'number' && !isNaN(val)) {
      return formatCurrencyShort(val)
    }
    return val
  }

  return (
    <StatCard
      icon={icon}
      title={title}
      value={loading || error ? null : formatValue(value)}
      loading={loading}
      error={error}
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 hover:scale-105"
    />
  )
}

// Donation Details Modal
const DonationDetailsModal = ({ donation, isOpen, onClose }) => {
  if (!donation) return null;

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMM yyyy, h:mm a');
  };

  const getPaymentMethodLabel = (method) => {
    const methodLabels = {
      bank_transfer: 'Bank Transfer',
      jazzcash: 'JazzCash',
      easypaisa: 'EasyPaisa'
    };
    return methodLabels[method] || method;
  };

  const getDonationTypeLabel = (type) => {
    const typeLabels = {
      general: 'General',
      appeal_specific: 'Appeal Specific',
      zakat: 'Zakat',
      sadaqah: 'Sadaqah'
    };
    return typeLabels[type] || type;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Donation Details">
      <div className="space-y-6">
        {/* Donor Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <Heading size="md" className="mb-3">Donor Information</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text size="sm" muted>Name</Text>
              <Text className="font-semibold">{donation.donor?.name || 'N/A'}</Text>
            </div>
            <div>
              <Text size="sm" muted>Email</Text>
              <Text className="font-semibold">{donation.donor?.email || 'N/A'}</Text>
            </div>
            <div>
              <Text size="sm" muted>Phone</Text>
              <Text className="font-semibold">{donation.donor?.phone || 'N/A'}</Text>
            </div>
            <div>
              <Text size="sm" muted>Role</Text>
              <Text className="font-semibold capitalize">{donation.donor?.role || 'N/A'}</Text>
            </div>
          </div>
        </div>

        {/* Donation Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <Heading size="md" className="mb-3">Donation Information</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text size="sm" muted>Amount</Text>
              <Text className="font-semibold text-lg">{formatCurrencyShort(donation.amount)}</Text>
            </div>
            <div>
              <Text size="sm" muted>Payment Method</Text>
              <Text className="font-semibold">{getPaymentMethodLabel(donation.payment_method)}</Text>
            </div>
            <div>
              <Text size="sm" muted>Donation Type</Text>
              <Text className="font-semibold">{getDonationTypeLabel(donation.donation_type)}</Text>
            </div>
            <div>
              <Text size="sm" muted>Transaction ID</Text>
              <Text className="font-semibold font-mono">{donation.transaction_id || 'N/A'}</Text>
            </div>
            <div>
              <Text size="sm" muted>Created At</Text>
              <Text className="font-semibold">{formatDate(donation.created_at)}</Text>
            </div>
          </div>
          {donation.note && (
            <div className="mt-4">
              <Text size="sm" muted>Note</Text>
              <Text className="font-semibold">{donation.note}</Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Enhanced Donations Table with smooth transitions
const DonationsTable = ({ donations, loading, error, onView, totalCount, filteredCount, currentPage, pageSize, onPageChange, onPageSizeChange }) => {
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getPaymentMethodLabel = (method) => {
    const methodLabels = {
      bank_transfer: 'Bank Transfer',
      jazzcash: 'JazzCash',
      easypaisa: 'EasyPaisa'
    };
    return methodLabels[method] || method;
  };

  const getDonationTypeLabel = (type) => {
    const typeLabels = {
      general: 'General',
      appeal_specific: 'Appeal Specific',
      zakat: 'Zakat',
      sadaqah: 'Sadaqah'
    };
    return typeLabels[type] || type;
  };

  const columns = [
    { key: 'donor', title: 'Donor', render: (donation) => donation.donor?.name || 'N/A' },
    { key: 'amount', title: 'Amount', render: (donation) => formatCurrencyShort(donation.amount) },
    { key: 'payment_method', title: 'Method', render: (donation) => getPaymentMethodLabel(donation.payment_method) },
    { key: 'created_at', title: 'Date', render: (donation) => formatDate(donation.created_at) },
    { key: 'appeal', title: 'Appeal Linked', render: (donation) => donation.appeal ? (
      <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" title="Linked" />
    ) : (
      <XMarkIcon className="w-5 h-5 text-red-400 mx-auto" title="Not linked" />
    ) },
  ];

  const data = donations.map(donation => ({
    ...donation,
    key: donation.id
  }));

  const actions = [
    {
      label: 'View',
      icon: <EyeIcon className="w-5 h-5" />, // Pass as element, not component
      onClick: onView,
      className: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
    }
  ];

  const pagination = {
    page: currentPage,
    pageSize: pageSize,
    total: totalCount,
    onPageChange,
    totalCount,
    filteredCount
  };

  const pageSizeSelector = (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">Show</span>
      <select
        value={pageSize}
        onChange={onPageSizeChange}
        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
      </select>
      <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 transition-all duration-300 relative">
      {/* Subtle loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex items-center justify-center transition-opacity duration-200">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Updating...</span>
          </div>
        </div>
      )}
      
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-75' : 'opacity-100'}`}>
        <AdminTable
          columns={columns}
          data={data}
          loading={false} // Don't let AdminTable handle loading state
          error={error}
          actions={actions}
          pagination={pagination}
          pageSizeSelector={pageSizeSelector}
          emptyState="No donations found."
          errorState="Error loading donations."
        />
      </div>
    </div>
  );
};

// Main Donations Component with Error Boundary and Suspense
const Donations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: 'all',
    appealLinked: undefined,
    dateFrom: '',
    dateTo: ''
  });
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoized filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [filters]);

  // Stat cards: always show global totals
  const { stats, loading: statsLoading, error: statsError } = useDonationStats();

  // Table: filtered
  const { donations, loading, error, totalCount, filteredCount } = useDonations(
    memoizedFilters, currentPage, pageSize
  );
  
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilters({
      search: '',
      paymentMethod: 'all',
      appealLinked: undefined,
      dateFrom: '',
      dateTo: ''
    });
    setActiveFilter('all');
    setCurrentPage(1);
  }, []);

  const handleStatCardClick = useCallback((filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    
    // Update the actual filters based on the stat card clicked
    let newPaymentMethod = 'all';
    if (filter === 'bank') {
      newPaymentMethod = 'bank_transfer';
    } else if (filter === 'jazzcash') {
      newPaymentMethod = 'jazzcash';
    } else if (filter === 'easypaisa') {
      newPaymentMethod = 'easypaisa';
    }
    
    setFilters(prev => ({
      ...prev,
      paymentMethod: newPaymentMethod
    }));
  }, []);

  const handleViewDonation = useCallback((donation) => {
    setSelectedDonation(donation);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDonation(null);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  }, []);

  // Don't render if user is not admin
  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <DonationsErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <Heading level={1}>Donations</Heading>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedStatCard
            icon={CurrencyDollarIcon}
            title="Total Donations"
            value={stats.totalAmount}
            loading={statsLoading}
            error={statsError}
            onClick={() => handleStatCardClick('all')}
          />
          <EnhancedStatCard
            icon={BanknotesIcon}
            title="Via Bank"
            value={stats.viaBank}
            loading={statsLoading}
            error={statsError}
            onClick={() => handleStatCardClick('bank')}
          />
          <EnhancedStatCard
            icon={CreditCardIcon}
            title="Via JazzCash"
            value={stats.viaJazzCash}
            loading={statsLoading}
            error={statsError}
            onClick={() => handleStatCardClick('jazzcash')}
          />
          <EnhancedStatCard
            icon={CreditCardIcon}
            title="Via Easypaisa"
            value={stats.viaEasypaisa}
            loading={statsLoading}
            error={statsError}
            onClick={() => handleStatCardClick('easypaisa')}
          />
        </div>

        {/* Filter Bar */}
        <DonationFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          activeFilter={activeFilter}
          onClearFilter={handleClearFilter}
        />

        {/* Donations Table with smooth loading */}
        <DonationsTable
          donations={donations}
          loading={loading}
          error={error}
          onView={handleViewDonation}
          totalCount={totalCount}
          filteredCount={filteredCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Donation Details Modal */}
        <DonationDetailsModal
          donation={selectedDonation}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </DonationsErrorBoundary>
  );
};

export default Donations; 