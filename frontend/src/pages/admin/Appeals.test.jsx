import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '../../context/ThemeContext'
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
        title: 'Test Appeal',
        description: 'Test appeal description',
        category: 'medical',
        amount_requested: '1000.00',
        status: 'pending',
        is_fulfilled: false,
        fulfillment_source: null,
        created_at: '2025-07-13T10:00:00Z',
        beneficiary_name: 'Test User',
        approved_by_name: null,
        rejected_by_name: null,
        cancelled_by_name: null
      }
    ],
    loading: false,
    error: null,
    totalCount: 1,
    approveAppeal: jest.fn(),
    rejectAppeal: jest.fn(),
    cancelAppeal: jest.fn()
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('Appeals Component', () => {
  test('renders appeals page with title', () => {
    renderWithRouter(<Appeals />)
    // There are multiple elements with text 'Appeals', so check that at least one heading exists
    const headings = screen.getAllByText('Appeals')
    expect(headings.length).toBeGreaterThan(0)
    expect(screen.getByText('Manage and review user appeals')).toBeInTheDocument()
  })

  test('renders stats cards', () => {
    renderWithRouter(<Appeals />)
    expect(screen.getByText('Total Appeals')).toBeInTheDocument()
    // There are multiple 'Pending', 'Approved', 'Rejected' texts; check at least one exists for each
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0)
  })

  test('renders filter controls', () => {
    renderWithRouter(<Appeals />)
    expect(screen.getByPlaceholderText('Search appeals...')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
  })

  test('renders appeals table', () => {
    renderWithRouter(<Appeals />)
    expect(screen.getByText('Appeal ID')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Purpose')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Fulfillment')).toBeInTheDocument()
    // The table header for created date is 'Created At'
    expect(screen.getByText(/Created/i)).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  test('displays appeal data in table', () => {
    renderWithRouter(<Appeals />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getAllByText(/medical/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0)
  })

  test('shows view action button', () => {
    renderWithRouter(<Appeals />)
    // Use a regex to match the View button text
    expect(screen.getByText(/View/i)).toBeInTheDocument()
  })
}) 