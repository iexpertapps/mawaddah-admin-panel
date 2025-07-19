import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Donations from './Donations';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'admin' },
    token: 'test-token'
  })
}));

// Mock the AdminLayout component
jest.mock('../../components/layout/AdminLayout', () => {
  return function MockAdminLayout({ children }) {
    return <div data-testid="admin-layout">{children}</div>;
  };
});

// Mock the StatCard component
jest.mock('../../components/molecules/StatCard', () => {
  return function MockStatCard({ title, value }) {
    return <div data-testid="stat-card">{title}: {value}</div>;
  };
});

// Mock the AdminTable component
jest.mock('../../components/molecules/AdminTable', () => {
  return function MockAdminTable({ data, loading, error }) {
    if (loading) return <div data-testid="loading">Loading...</div>;
    if (error) return <div data-testid="error">{error}</div>;
    return <div data-testid="admin-table">Table with {data?.length || 0} items</div>;
  };
});

// Mock the Drawer component
jest.mock('../../components/molecules/Drawer', () => {
  return function MockDrawer({ isOpen, children }) {
    if (!isOpen) return null;
    return <div data-testid="drawer">{children}</div>;
  };
});

describe('Donations Page', () => {
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear();
    
    // Mock successful API responses
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        count: 0,
        results: [],
        meta: {
          total_amount: 0,
          via_bank: 0,
          via_jazzcash: 0,
          via_easypaisa: 0
        }
      })
    });
  });

  const renderDonations = () => {
    return render(
      <BrowserRouter>
        <Donations />
      </BrowserRouter>
    );
  };

  test('renders donations page with title', () => {
    renderDonations();
    expect(screen.getByText('Donations')).toBeInTheDocument();
  });

  test('renders stat cards', () => {
    renderDonations();
    expect(screen.getByText('Total Donations: 0')).toBeInTheDocument();
    expect(screen.getByText('Via Bank: 0')).toBeInTheDocument();
    expect(screen.getByText('Via JazzCash: 0')).toBeInTheDocument();
    expect(screen.getByText('Via Easypaisa: 0')).toBeInTheDocument();
  });

  test('renders admin layout', () => {
    renderDonations();
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });

  test('initially shows loading state', () => {
    renderDonations();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
}); 