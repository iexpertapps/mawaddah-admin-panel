import React from 'react';
import { render, screen } from '@testing-library/react';
import RecipientTransactionTable from '@/components/wallet/RecipientTransactionTable';
import { useRecipientWallet } from '@/hooks/wallet/useRecipientWallet';

jest.mock('@/hooks/wallet/useRecipientWallet');
const mockUseRecipientWallet = useRecipientWallet as jest.Mock;

describe('RecipientTransactionTable', () => {
  it('shows skeleton when loading', () => {
    mockUseRecipientWallet.mockReturnValue({ transactions: [], loading: true });
    render(<RecipientTransactionTable />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('shows empty state when no transactions', () => {
    mockUseRecipientWallet.mockReturnValue({ transactions: [], loading: false });
    render(<RecipientTransactionTable />);
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });

  it('renders transactions', () => {
    mockUseRecipientWallet.mockReturnValue({
      transactions: [
        { id: 1, type: 'credit', amount: 200, appeal_id: 2, donor_name: 'Donor', timestamp: new Date().toISOString() },
      ],
      loading: false,
    });
    render(<RecipientTransactionTable />);
    expect(screen.getByText(/₨200/)).toBeInTheDocument();
    expect(screen.getByText(/credit/i)).toBeInTheDocument();
  });
}); 