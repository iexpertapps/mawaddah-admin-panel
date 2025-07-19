import React from 'react';
import { Wallet as WalletIcon } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import Skeleton from '@/components/atoms/Skeleton';
import { useRecipientWallet } from '@/hooks/wallet/useRecipientWallet';

export default function RecipientWalletBalance() {
  const { wallet, loading } = useRecipientWallet();

  return (
    <Card className="shadow-md rounded-2xl flex items-center gap-4 p-6">
      <WalletIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
      <div>
        <div className="text-sm text-muted-foreground">Current Wallet Balance</div>
        <div className="text-3xl font-semibold text-green-600 dark:text-green-400">
          {loading ? <Skeleton className="h-10 w-32" /> : `₨${wallet?.balance?.toLocaleString() ?? 0}`}
        </div>
      </div>
    </Card>
  );
} 