import React from 'react';
import { render, screen } from '@testing-library/react';
import RecipientWalletBalance from '@/components/wallet/RecipientWalletBalance';
import { useRecipientWallet } from '@/hooks/wallet/useRecipientWallet';

jest.mock('@/hooks/wallet/useRecipientWallet');

const mockUseRecipientWallet = useRecipientWallet as jest.Mock;

describe('RecipientWalletBalance', () => {
  it('renders skeleton when loading', () => {
    mockUseRecipientWallet.mockReturnValue({ wallet: null, loading: true });
    render(<RecipientWalletBalance />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders wallet amount when loaded', () => {
    mockUseRecipientWallet.mockReturnValue({ wallet: { balance: 1234 }, loading: false });
    render(<RecipientWalletBalance />);
    expect(screen.getByText(/₨1234/)).toBeInTheDocument();
  });
}); 