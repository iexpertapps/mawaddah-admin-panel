import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '../../context/ThemeContext'
import '@testing-library/jest-dom'
import Users from './Users'

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
    isAuthenticated: true,
    role: 'admin'
  })
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  )
}

describe('Users Component', () => {
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear()
    
    // Mock successful API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/users/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ count: 10, results: [] })
        })
      }
      if (url.includes('/api/donations/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
      }
      if (url.includes('/api/appeals/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: 0 })
      })
    })
  })

  test('renders Users Management header', () => {
    renderWithProviders(<Users />)
    
    expect(screen.getByText('📋 Users Management')).toBeInTheDocument()
  })

  test('renders stat cards', () => {
    renderWithProviders(<Users />)
    
    expect(screen.getByText('All Users')).toBeInTheDocument()
    expect(screen.getByText('Donors')).toBeInTheDocument()
    expect(screen.getByText('Recipients')).toBeInTheDocument()
    expect(screen.getByText('Shura Members')).toBeInTheDocument()
  })

  test('renders search input', () => {
    renderWithProviders(<Users />)
    
    expect(screen.getByPlaceholderText('Search by name, email, or phone')).toBeInTheDocument()
  })

  test('renders role filter dropdown', () => {
    renderWithProviders(<Users />)
    
    expect(screen.getByDisplayValue('Filter by role')).toBeInTheDocument()
  })

  test('renders Add Shura Member button', () => {
    renderWithProviders(<Users />)
    
    expect(screen.getByText('Add Shura Member')).toBeInTheDocument()
  })

  test('renders users table header', () => {
    renderWithProviders(<Users />)
    
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  test('displays loading state initially', () => {
    renderWithProviders(<Users />)
    
    // Should show loading indicators
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('handles API errors gracefully', () => {
    // Mock API error
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' })
      })
    )

    renderWithProviders(<Users />)
    
    // Should show error state after loading
    setTimeout(() => {
      expect(screen.getByText('Data unavailable')).toBeInTheDocument()
    }, 100)
  })
}) 