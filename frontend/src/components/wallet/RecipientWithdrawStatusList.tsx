import React from 'react';
import { useRecipientWallet } from '../../hooks/wallet/useRecipientWallet';
import { formatCurrencyShort } from '../../utils';

export default function RecipientWithdrawStatusList() {
  const { transactions, loading, error } = useRecipientWallet();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-4">Recent Transactions</div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-4">Recent Transactions</div>
        <div className="text-red-500">Error loading transactions: {error}</div>
      </div>
    );
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-lg font-semibold mb-4">Recent Transactions</div>
      {recentTransactions.length === 0 ? (
        <div className="text-gray-500">No transactions found.</div>
      ) : (
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm text-gray-500">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className={`font-semibold ${
                transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.transaction_type === 'credit' ? '+' : '-'}Rs {formatCurrencyShort(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 