import React, { useState } from 'react';
import AdminTable from '../molecules/AdminTable';
import { Badge } from '../atoms/Badge';
import { formatCurrencyShort } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { Input } from '../atoms';
import { SearchIcon } from '../atoms/Icons';
import Switch from '../atoms/Switch';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Drawer from '../molecules/Drawer';

// Utility for human-readable datetime
const formatDateTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
};

// Color mapping for transfer_by
const transferByColors = {
  Donor: 'success',
  Admin: 'default',
  System: 'warning',
};

// Color mapping for role
const roleColors = {
  Donor: 'success',
  Recipient: 'default',
  Admin: 'warning',
};

const WalletsTable = ({ data = [] }) => {
  const navigate = useNavigate();
  // Filter/search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedTransferBy, setSelectedTransferBy] = useState('All');
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    setDebounceTimeout(setTimeout(() => setSearchTerm(value), 300));
  };

  // Filtered data logic (existing filters)
  let filteredData = data.filter(row => {
    if (showZeroOnly && row.balance !== 0) return false;
    if (selectedRole !== 'All' && row.role !== selectedRole) return false;
    if (selectedTransferBy !== 'All' && row.transfer_by !== selectedTransferBy) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        row.user.toLowerCase().includes(term) ||
        (row.appeal_id && row.appeal_id.toString().includes(term)) ||
        (row.transfer_by && row.transfer_by.toLowerCase().includes(term)) ||
        (row.description && row.description.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // Reset page if filters change and page is out of range
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // Page size selector
  const pageSizeSelector = (
    <select
      value={pageSize}
      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-2"
      style={{ minWidth: 60 }}
      aria-label="Records per page"
    >
      {[5, 10, 20, 50, 100].map(size => (
        <option key={size} value={size}>{size} / page</option>
      ))}
    </select>
  );

  const columns = [
    {
      key: 'user',
      title: 'User',
      minWidth: 120,
      render: row => <span className="font-medium text-gray-900 dark:text-gray-100">{row.user}</span>,
    },
    {
      key: 'role',
      title: 'Role',
      minWidth: 80,
      render: row => <Badge variant={roleColors[row.role] || 'default'}>{row.role}</Badge>,
    },
    {
      key: 'credit',
      title: 'Credit',
      minWidth: 90,
      render: row => (
        <span className="text-green-600 font-medium">+ Rs {formatCurrencyShort(row.credit)}</span>
      ),
    },
    {
      key: 'debit',
      title: 'Debit',
      minWidth: 90,
      render: row => (
        <span className="text-red-600 font-medium">– Rs {formatCurrencyShort(row.debit)}</span>
      ),
    },
    {
      key: 'balance',
      title: 'Balance',
      minWidth: 100,
      render: row => (
        <span className="font-bold text-gray-900 dark:text-gray-100">Rs {formatCurrencyShort(row.balance)}</span>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      minWidth: 180,
      render: row => (
        <span
          className="truncate block max-w-xs cursor-help text-gray-300 dark:text-gray-400"
          title={row.description}
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {row.description}
        </span>
      ),
    },
    {
      key: 'appeal',
      title: 'Appeal',
      minWidth: 80,
      render: row => (
        <span
          className="text-gray-900 dark:text-gray-100 cursor-pointer hover:underline"
          onClick={() => { setSelectedAppeal(row); setDrawerOpen(true); }}
          tabIndex={0}
          role="button"
          aria-label={`View Appeal #${row.appeal_id}`}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedAppeal(row); setDrawerOpen(true); } }}
        >
          #{row.appeal_id}
        </span>
      ),
    },
    {
      key: 'transfer_by',
      title: 'Transfer By',
      minWidth: 100,
      render: row => (
        <Badge variant={transferByColors[row.transfer_by] || 'default'}>{row.transfer_by}</Badge>
      ),
    },
    {
      key: 'last_activity',
      title: 'Last Activity',
      minWidth: 160,
      render: row => (
        <span className="text-gray-400 dark:text-gray-500">{formatDateTime(row.last_activity)}</span>
      ),
    },
  ];

  // Responsive: hide description and transfer_by on small screens
  const visibleColumns = columns.filter(col =>
    window.innerWidth > 640 || !['description', 'transfer_by'].includes(col.key)
  );

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-lg">
      {/* Filter/Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input with Icon */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by user name, donor name, appeal ID, or transfer source..."
              value={searchTerm}
              onChange={handleSearchChange}
              icon={<SearchIcon />}
            />
          </div>
          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>All</option>
              <option>Donor</option>
              <option>Recipient</option>
              <option>Admin</option>
            </select>
          </div>
          {/* Transfer By Filter */}
          <div className="sm:w-48">
            <select
              value={selectedTransferBy}
              onChange={e => setSelectedTransferBy(e.target.value)}
              className="w-full px-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>All</option>
              <option>Donor</option>
              <option>Admin</option>
              <option>System</option>
            </select>
          </div>
          {/* Zero Balance Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <Switch
              checked={showZeroOnly}
              onChange={() => setShowZeroOnly(v => !v)}
              id="zero-balance-toggle"
            />
            <span className="text-xs font-medium text-gray-400">Zero Balance</span>
          </div>
        </div>
      </div>
      <AdminTable
        columns={visibleColumns}
        data={paginatedData}
        emptyState="No wallet data found."
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage
        }}
        pageSizeSelector={pageSizeSelector}
      />
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedAppeal ? `Appeal #${selectedAppeal.appeal_id}` : ''}
      >
        {selectedAppeal && (
          <div className="space-y-4">
            <div><strong>User:</strong> {selectedAppeal.user}</div>
            <div><strong>Role:</strong> {selectedAppeal.role}</div>
            <div><strong>Credit:</strong> Rs {formatCurrencyShort(selectedAppeal.credit)}</div>
            <div><strong>Debit:</strong> Rs {formatCurrencyShort(selectedAppeal.debit)}</div>
            <div><strong>Balance:</strong> Rs {formatCurrencyShort(selectedAppeal.balance)}</div>
            <div><strong>Description:</strong> {selectedAppeal.description}</div>
            <div><strong>Transfer By:</strong> {selectedAppeal.transfer_by}</div>
            <div><strong>Last Activity:</strong> {formatDateTime(selectedAppeal.last_activity)}</div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

// Sample data for demonstration
const sampleData = [
  {
    user: "Fatima Zahra",
    role: "Recipient",
    credit: 42000,
    debit: 12000,
    balance: 30000,
    description: "Funds disbursed – Appeal #12",
    appeal_id: 12,
    transfer_by: "System",
    last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    user: "Ali Raza",
    role: "Donor",
    credit: 150000,
    debit: 0,
    balance: 150000,
    description: "Donation credited – Appeal #18",
    appeal_id: 18,
    transfer_by: "Donor",
    last_activity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    user: "Admin User",
    role: "Admin",
    credit: 0,
    debit: 5000,
    balance: 5000,
    description: "Manual adjustment",
    appeal_id: null,
    transfer_by: "Admin",
    last_activity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    user: "Zainab Fatima",
    role: "Recipient",
    credit: 10000,
    debit: 2000,
    balance: 8000,
    description: "Withdrawal by recipient",
    appeal_id: 4,
    transfer_by: "System",
    last_activity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
  },
  {
    user: "Hassan Donor",
    role: "Donor",
    credit: 25000,
    debit: 0,
    balance: 25000,
    description: "Donation credited – Appeal #12",
    appeal_id: 12,
    transfer_by: "Donor",
    last_activity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    user: "Sara Syed",
    role: "Recipient",
    credit: 0,
    debit: 3000,
    balance: 2000,
    description: "Funds disbursed – Appeal #4",
    appeal_id: 4,
    transfer_by: "System",
    last_activity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
  },
  {
    user: "System Refund",
    role: "Recipient",
    credit: 120000,
    debit: 0,
    balance: 120000,
    description: "Refund issued – Appeal #18",
    appeal_id: 18,
    transfer_by: "System",
    last_activity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  },
  {
    user: "Manual Admin",
    role: "Admin",
    credit: 50000,
    debit: 0,
    balance: 50000,
    description: "Manual credit added by Admin",
    appeal_id: null,
    transfer_by: "Admin",
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    user: "Taha Donor",
    role: "Donor",
    credit: 0,
    debit: 100000,
    balance: 0,
    description: "Withdrawal by donor",
    appeal_id: null,
    transfer_by: "Donor",
    last_activity: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
  },
  {
    user: "Maryam User",
    role: "Recipient",
    credit: 8000,
    debit: 8000,
    balance: 0,
    description: "Funds disbursed – Appeal #4",
    appeal_id: 4,
    transfer_by: "System",
    last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
  },
  {
    user: "Orphan Support",
    role: "Recipient",
    credit: 200000,
    debit: 0,
    balance: 200000,
    description: "Donation credited – Appeal #22",
    appeal_id: 22,
    transfer_by: "Donor",
    last_activity: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    user: "Late Refund",
    role: "Recipient",
    credit: 0,
    debit: 50000,
    balance: 10000,
    description: "Refund issued – Appeal #18",
    appeal_id: 18,
    transfer_by: "System",
    last_activity: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  }
];

export default function WalletsTableDemo() {
  return <WalletsTable data={sampleData} />;
} 