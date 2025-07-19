import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import Dashboard from './Dashboard'

// Mock fetch globally
global.fetch = jest.fn()

// Mock the hooks to return invalid data
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: null,
    role: null
  })
}))

jest.mock('../../hooks', () => ({
  useStatTotalUsers: () => ({ value: null, loading: false, error: null }),
  useStatTotalDonors: () => ({ value: undefined, loading: false, error: null }),
  useStatTotalShuraMembers: () => ({ value: NaN, loading: false, error: null }),
  useStatAppealsByShura: () => ({ value: 'invalid', loading: false, error: null }),
  useStatTotalDisbursed: () => ({ value: null, loading: false, error: 'Network error' }),
  useStatCancelledAppeals: () => ({ value: 0, loading: false, error: null }),
  useStatTotalDonationAmount: () => ({ value: null, loading: false, error: null })
}))

// Mock the components
jest.mock('../../components/layout/AdminLayout', () => {
  return function MockAdminLayout({ children, pageTitle }) {
    return <div data-testid="admin-layout">{children}</div>
  }
})

jest.mock('../../components/molecules/StatCard', () => {
  return function MockStatCard({ title, value, loading, error }) {
    return (
      <div data-testid={`stat-card-${title}`}>
        {loading ? 'Loading...' : error ? 'Error' : `Value: ${value}`}
      </div>
    )
  }
})

jest.mock('../../components/molecules/SystemAlert', () => {
  return function MockSystemAlert() {
    return <div data-testid="system-alert">System Alert</div>
  }
})

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard Resilience', () => {
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear()
  })

  test('renders without crashing when hooks return invalid data', () => {
    expect(() => renderDashboard()).not.toThrow()
  })

  test('displays error boundary when there are rendering errors', () => {
    renderDashboard()
    
    // Should show error boundary content
    expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong while loading the dashboard.')).toBeInTheDocument()
    expect(screen.getByText('Reload Dashboard')).toBeInTheDocument()
  })

  test('renders admin layout wrapper', () => {
    renderDashboard()
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
  })

  test('shows error state for cards with errors', () => {
    renderDashboard()
    
    // The error boundary should catch errors and show the error UI
    expect(screen.getByText('Dashboard Error')).toBeInTheDocument()
  })
}) 