import { useState, useEffect } from 'react';

export function useStatTotalDisbursed() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/wallet/transactions/', {
          credentials: 'include',
          headers: {
            'Authorization': token ? `Token ${token}` : '',
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch wallet transactions')

        const json = await res.json();
        const transactions = json.results || [];

        // Calculate total disbursed from debit transactions
        const totalDisbursed = transactions
          .filter(tx => tx.transaction_type === 'debit')
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        setData(totalDisbursed);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
} 