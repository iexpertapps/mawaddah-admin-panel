import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Appeals from './Appeals'

// Mock the hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@mawaddah.com',
      role: 'admin'
    },
    token: 'mock-token',
    isAuthenticated: true
  })
}))

jest.mock('../../hooks/useAppeals', () => ({
  useAppeals: () => ({
    appeals: [
      {
        id: 1,
        title: 'Medical Help',
        user: 'Recipient 1',
        type: 'medical',
        purpose: 'Surgery',
        amount: 10000,
        status: 'pending',
        fulfillment: 'Via Platform',
        created_at: '2025-07-13',
        donor_name: null
      }
    ],
    loading: false,
    error: null,
    fetchAppeals: jest.fn(),
    approveAppeal: jest.fn(),
    rejectAppeal: jest.fn(),
    cancelAppeal: jest.fn(),
    pagination: { page: 1, pageSize: 10, total: 1 },
    filters: {},
    setFilters: jest.fn(),
    setPage: jest.fn(),
    setPageSize: jest.fn()
  })
}))

describe('Admin Appeals Management Screen', () => {
  it('renders the appeals table and actions', async () => {
    render(
      <BrowserRouter>
        <Appeals />
      </BrowserRouter>
    )
    expect(screen.getByText('Medical Help')).toBeInTheDocument()
    expect(screen.getByText('Surgery')).toBeInTheDocument()
    expect(screen.getByText('Via Platform')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    jest.mock('../../hooks/useAppeals', () => ({
      useAppeals: () => ({
        appeals: [],
        loading: true,
        error: null,
        fetchAppeals: jest.fn(),
        approveAppeal: jest.fn(),
        rejectAppeal: jest.fn(),
        cancelAppeal: jest.fn(),
        pagination: { page: 1, pageSize: 10, total: 0 },
        filters: {},
        setFilters: jest.fn(),
        setPage: jest.fn(),
        setPageSize: jest.fn()
      })
    }))
    render(
      <BrowserRouter>
        <Appeals />
      </BrowserRouter>
    )
    expect(screen.getByTestId('appeals-loading')).toBeInTheDocument()
  })

  it('shows error state', () => {
    jest.mock('../../hooks/useAppeals', () => ({
      useAppeals: () => ({
        appeals: [],
        loading: false,
        error: 'Failed to fetch',
        fetchAppeals: jest.fn(),
        approveAppeal: jest.fn(),
        rejectAppeal: jest.fn(),
        cancelAppeal: jest.fn(),
        pagination: { page: 1, pageSize: 10, total: 0 },
        filters: {},
        setFilters: jest.fn(),
        setPage: jest.fn(),
        setPageSize: jest.fn()
      })
    }))
    render(
      <BrowserRouter>
        <Appeals />
      </BrowserRouter>
    )
    expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument()
  })
}) 