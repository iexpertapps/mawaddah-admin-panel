import React from 'react';
import { Banknote, TrendingUp, TrendingDown, CircleDollarSign } from 'lucide-react';
import Card from '../../components/atoms/Card';
import Skeleton from '../../components/atoms/Skeleton';
import { formatCurrencyShort } from '../../utils';

const statConfig = [
  {
    label: 'Transferred',
    icon: <Banknote className="w-6 h-6 text-green-700" />, key: 'total', currency: true,
  },
  {
    label: 'Disbursed',
    icon: <CircleDollarSign className="w-6 h-6 text-yellow-600" />, key: 'disbursed', currency: true,
  },
  {
    label: 'Credited',
    icon: <TrendingUp className="w-6 h-6 text-blue-600" />, key: 'credits', currency: true,
  },
  {
    label: 'Withdrawn',
    icon: <TrendingDown className="w-6 h-6 text-rose-600" />, key: 'debits', currency: true,
  },
  {
    label: 'Balance',
    icon: <CircleDollarSign className="w-6 h-6 text-emerald-700" />, key: 'balance', currency: true,
  },
];

export default function WalletStatCards() {
  const [stats, setStats] = React.useState({
    total: 0,
    credits: 0,
    debits: 0,
    disbursed: 0,
    balance: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Updated to use new admin analytics endpoint
        const response = await fetch('/api/wallet/admin/overview/', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch wallet stats');
        const result = await response.json();
        // Map backend fields to local keys if needed
        setStats({
          total: result.total_transactions ?? 0,
          credits: result.total_credits ?? 0,
          debits: result.total_debits ?? 0,
          disbursed: result.total_disbursed ?? 0,
          balance: result.total_current_balance ?? 0,
        });
      } catch (err) {
        console.error('Failed to fetch wallet stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {statConfig.map(({ label, icon, key, currency }) => (
        <Card key={key as string} className="shadow-md rounded-2xl p-4 flex flex-col items-center">
          {icon}
          <div className="mt-2 text-2xl font-bold">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : currency ? (
              `Rs ${formatCurrencyShort(stats[key as keyof typeof stats] ?? 0)}`
            ) : (
              stats[key as keyof typeof stats] ?? 0
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </Card>
      ))}
    </div>
  );
} 