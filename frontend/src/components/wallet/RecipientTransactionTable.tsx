import React from 'react';
import { useRecipientWallet } from '@/hooks/wallet/useRecipientWallet';
import Skeleton from '@/components/atoms/Skeleton';
import { Badge } from '@/components/atoms/Badge';

function TypeBadge({ type }: { type: string }) {
  const color = type === 'credit' ? 'success' : 'destructive';
  return <Badge variant={color}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
}

export default function RecipientTransactionTable() {
  const { transactions, loading } = useRecipientWallet();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-4">
      <div className="text-lg font-semibold mb-4">Transaction History</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-800">
              <th className="p-2">Type</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Appeal</th>
              <th className="p-2">Timestamp</th>
              <th className="p-2">Donor</th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-50 transition' : ''}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}><Skeleton className="h-8 w-full" /></td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No transactions yet. Once donations are received or funds withdrawn, you'll see them here.
                </td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="p-2"><TypeBadge type={tx.type} /></td>
                  <td className="p-2">₨{tx.amount}</td>
                  <td className="p-2">{tx.appeal_id ? tx.appeal_id : <span className="text-xs text-muted-foreground">—</span>}</td>
                  <td className="p-2">{new Date(tx.timestamp).toLocaleString()}</td>
                  <td className="p-2">{tx.donor_name || <span className="text-xs text-muted-foreground">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 