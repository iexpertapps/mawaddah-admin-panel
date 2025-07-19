import React, { useState } from 'react';
import Skeleton from '../../components/atoms/Skeleton';
import { Inbox } from 'lucide-react';
import { Button } from '../../components/atoms/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatCurrencyShort } from '../../utils';
import Drawer from '../molecules/Drawer';

interface Transaction {
  id: number;
  user_name?: string;
  amount: number;
  type: string;
  description?: string;
  created_at: string;
  // Appeal info
  appeal_id?: number | null;
  appeal_title?: string;
}

export default function WithdrawalTable() {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [appealDetail, setAppealDetail] = useState<any>(null);
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  // TODO: Replace with actual wallet transaction hook
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Updated to use new admin analytics endpoint for all transactions
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        search: search,
      });
      const response = await fetch(`/api/wallet/admin/transactions/?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const result = await response.json();
      // Map backend fields to table columns
      setData((result.results || []).map((row: any) => ({
        id: row.id,
        user_name: row.user_name || row.user_email || 'N/A',
        amount: row.amount ?? 0,
        type: row.type || '-',
        description: row.description || '-',
        created_at: row.timestamp || '',
        appeal_id: row.appeal_id,
        appeal_title: row.appeal_title,
      })));
      setPageCount(Math.ceil((result.count || 1) / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealClick = async (appealId: number) => {
    setDrawerOpen(true);
    setAppealDetail(null);
    setAppealLoading(true);
    setAppealError(null);
    try {
      const response = await fetch(`/api/appeals/${appealId}/`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch appeal details');
      const data = await response.json();
      setAppealDetail(data);
    } catch (err) {
      setAppealError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAppealLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, search]);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-300">#</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-300">User</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-300">Appeal</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-300">Type</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-300">Created At</th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-50 transition' : ''}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4"><Skeleton className="h-6 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-8 h-8 opacity-40" />
                      No transactions found.
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="py-3 px-4">{row.user_name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {row.appeal_id && row.appeal_title ? (
                        <button
                          type="button"
                          className="text-white hover:underline bg-transparent p-0 m-0 border-0 cursor-pointer"
                          style={{ background: 'none' }}
                          onClick={() => handleAppealClick(row.appeal_id!)}
                        >
                          {row.appeal_title}
                        </button>
                      ) : (
                        row.appeal_title || '-'
                      )}
                    </td>
                    <td className="py-3 px-4">Rs {formatCurrencyShort(row.amount)}</td>
                    <td className="py-3 px-4 capitalize">{row.type}</td>
                    <td className="py-3 px-4">{row.description || 'N/A'}</td>
                    <td className="py-3 px-4">{row.created_at ? new Date(row.created_at).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true
                    }) : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination and page size selector */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm px-2">Page {page} of {pageCount}</span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
      {/* Appeal Detail Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={appealDetail?.title || 'Appeal Details'}>
        {appealLoading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : appealError ? (
          <div className="py-8 text-center text-red-500">{appealError}</div>
        ) : appealDetail ? (
          <div className="space-y-4">
            <div><b>Category:</b> {appealDetail.category}</div>
            <div><b>Status:</b> {appealDetail.status}</div>
            <div><b>Amount Requested:</b> Rs {formatCurrencyShort(appealDetail.amount_requested)}</div>
            <div><b>Beneficiary:</b> {appealDetail.user_name || '-'}</div>
            <div><b>Description:</b> {appealDetail.description || '-'}</div>
            <div><b>Donor Linked:</b> {appealDetail.is_donor_linked === true ? 'Yes' : appealDetail.is_donor_linked === false ? 'No' : '-'}</div>
            <div><b>Created At:</b> {appealDetail.created_at ? new Date(appealDetail.created_at).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            }) : '-'}</div>
            <div><b>Approved By:</b> {appealDetail.approved_by_name || '-'}</div>
            <div><b>Rejected By:</b> {appealDetail.rejected_by_name || '-'}</div>
            <div><b>Cancelled By:</b> {appealDetail.cancelled_by_name || '-'}</div>
            {appealDetail.rejection_reason && <div><b>Rejection Reason:</b> {appealDetail.rejection_reason}</div>}
          </div>
        ) : null}
      </Drawer>
    </>
  );
} 