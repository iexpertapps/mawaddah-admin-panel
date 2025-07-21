import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface WalletTransaction {
  id: number;
  amount: number;
  transaction_type: 'credit' | 'debit';
  type: string;
  description: string;
  created_at: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  appeal_id?: number;
  donor_name?: string;
}

export interface WalletBalance {
  balance: number;
  total_received: number;
  total_withdrawn: number;
}

export function useRecipientWallet() {
  const { user } = useAuth() as any;
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch wallet balance
      const balanceResponse = await fetch('/api/wallet/balance/', {
        credentials: 'include',
      });

      if (!balanceResponse.ok) {
        throw new Error('Failed to fetch wallet balance');
      }

      const balanceData = await balanceResponse.json();
      setBalance(balanceData);

      // Fetch transactions
      const transactionsResponse = await fetch('/api/wallet/transactions/', {
        credentials: 'include',
      });

      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const refreshData = () => {
    fetchWalletData();
  };

  return {
    balance,
    transactions,
    loading,
    error,
    refreshData,
  };
} 