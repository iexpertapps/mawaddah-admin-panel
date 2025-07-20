import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import AdminLayout from '../../../components/layout/AdminLayout';
import WalletStatCards from '../../../components/wallet/WalletStatCards';
import WalletsTableDemo from '../../../components/wallet/WalletsTable';
import Card from '../../../components/atoms/Card';
import { Heading } from '../../../components/atoms/typography/Heading';
import ProtectedRoute from '../../../components/router/ProtectedRoute';

function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <span className="text-2xl font-bold mb-2">Something went wrong. Please try refreshing.</span>
    </div>
  );
}

const AdminWalletPage = () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto py-8">
        <Heading as="h1" size="3xl" className="mb-2">Wallet Management</Heading>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Monitor wallet transactions, balances, and disbursements with full visibility and controls.
        </p>
        <WalletStatCards />
        <div className="mt-8">
          <Card>
            <WalletsTableDemo />
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  </ProtectedRoute>
);

export default AdminWalletPage; 