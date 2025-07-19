import React, { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/router/ProtectedRoute';
import StatCard from '@/components/molecules/StatCard';
import AdminTable from '@/components/molecules/AdminTable';
import Drawer from '@/components/molecules/Drawer';
import EmptyState from '@/components/molecules/EmptyState';
import Skeleton from '@/components/atoms/Skeleton';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { toast } from '@/hooks/useToast';
import { formatCurrencyShort } from '@/utils';
import apiClient from '@/services';

const PAGE_SIZE = 10;

function WalletAdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [recipients, setRecipients] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState(''); // 'withdrawals' | 'transfers'
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerData, setDrawerData] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerUserId, setDrawerUserId] = useState(null);

  // Fetch stat cards
  useEffect(() => {
    setLoadingStats(true);
    apiClient.get('/api/wallet/admin/overview/')
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load wallet data.'))
      .finally(() => setLoadingStats(false));
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch recipients
  const fetchRecipients = useCallback(() => {
    setLoadingTable(true);
    apiClient.get('/api/wallet/admin/recipients/', {
      params: {
        page,
        page_size: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
    })
      .then(res => {
        setRecipients(res.data.results);
        setPageCount(Math.ceil(res.data.count / PAGE_SIZE));
      })
      .catch(() => toast.error('Failed to load wallet data.'))
      .finally(() => setLoadingTable(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // Drawer handlers
  const openDrawer = (userId, type) => {
    setDrawerUserId(userId);
    setDrawerType(type);
    setDrawerTitle(type === 'withdrawals' ? 'Withdrawal History' : 'Transfer History');
    setDrawerOpen(true);
    setDrawerLoading(true);
    const url = type === 'withdrawals'
      ? `/api/wallet/admin/recipients/${userId}/withdrawals/`
      : `/api/wallet/admin/recipients/${userId}/transfers/`;
    apiClient.get(url)
      .then(res => setDrawerData(res.data))
      .catch(() => toast.error('Failed to load wallet data.'))
      .finally(() => setDrawerLoading(false));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerData([]);
    setDrawerUserId(null);
    setDrawerType('');
    setDrawerTitle('');
  };

  // Table columns
  const columns = [
    {
      Header: 'Name',
      accessor: 'name',
      Cell: ({ value }) => value,
    },
    {
      Header: 'Email',
      accessor: 'email',
      Cell: ({ value }) => value,
    },
    {
      Header: 'Total Received',
      accessor: 'total_received',
      Cell: ({ value, row }) => (
        <button
          className="text-green-700 font-semibold hover:underline focus:outline-none"
          onClick={() => openDrawer(row.original.id, 'transfers')}
        >
          Rs {formatCurrencyShort(value)}
        </button>
      ),
    },
    {
      Header: 'Withdrawn',
      accessor: 'total_withdrawn',
      Cell: ({ value, row }) => (
        <button
          className="text-yellow-700 font-semibold hover:underline focus:outline-none"
          onClick={() => openDrawer(row.original.id, 'withdrawals')}
        >
          Rs {formatCurrencyShort(value)}
        </button>
      ),
    },
    {
      Header: 'Balance',
      accessor: 'current_balance',
      Cell: ({ value }) => `Rs ${formatCurrencyShort(value)}`,
    },
  ];

  // Pagination controls
  const Pagination = () => (
    pageCount > 1 && (
      <div className="flex items-center gap-2 justify-end mt-4">
        <button
          className="p-2 rounded disabled:opacity-50"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium">Page {page} of {pageCount}</span>
        <button
          className="p-2 rounded disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={page === pageCount}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    )
  );

  // Stat cards config
  const statCards = [
    {
      label: 'Total Withdrawn Amount',
      value: loadingStats ? <Skeleton className="h-8 w-20" /> : `Rs ${formatCurrencyShort(stats?.total_withdrawn_amount ?? 0)}`,
      color: 'yellow',
    },
    {
      label: 'Total Current Balance',
      value: loadingStats ? <Skeleton className="h-8 w-20" /> : `Rs ${formatCurrencyShort(stats?.total_current_balance ?? 0)}`,
      color: 'green',
    },
  ];

  return (
    <ProtectedRoute role="admin">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1">Wallet Analytics</h1>
        <p className="text-gray-600 mb-6">Monitor recipient wallet activity, balance, and transaction records.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => (
            <StatCard key={card.label} label={card.label} value={card.value} color={card.color} />
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div className="font-semibold text-lg">Recipients</div>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring"
            placeholder="Search recipients…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {loadingTable ? (
            <div className="p-8">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
            </div>
          ) : recipients.length === 0 ? (
            <EmptyState message="No recipients found." />
          ) : (
            <AdminTable columns={columns} data={recipients} />
          )}
        </div>
        <Pagination />
        <Drawer open={drawerOpen} onClose={closeDrawer} title={drawerTitle} fullWidthOnMobile>
          {drawerLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Skeleton className="h-6 w-32" />
            </div>
          ) : drawerData.length === 0 ? (
            <EmptyState message="No transactions found." />
          ) : (
            <div className="p-4 space-y-4">
              {drawerData.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="text-gray-700 font-medium">{item.date}</div>
                  <div className="text-gray-900 font-bold">Rs {formatCurrencyShort(item.amount)}</div>
                  {drawerType === 'transfers' && (
                    <div className="text-gray-500 text-sm">{item.transferred_by}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Drawer>
      </div>
    </ProtectedRoute>
  );
}

export default WalletAdminAnalyticsPage; 