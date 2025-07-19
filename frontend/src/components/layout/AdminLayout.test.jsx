import '@testing-library/jest-dom'
import React from 'react'
import { render as rtlRender, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { ThemeProvider } from '../../context/ThemeContext'

// Mock localStorage for Jest (Node environment)
if (!global.localStorage) {
  let store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      name: 'Admin User',
      email: 'admin@mawaddah.com',
      avatar: '/avatar.jpg'
    }
  })
}))

// Custom render to wrap in ThemeProvider and MemoryRouter
function render(ui, options) {
  return rtlRender(
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>,
    options
  )
}

describe('AdminLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.resetAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders sidebar with navigation items', () => {
    render(<AdminLayout />)
    
    // Check navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Appeals')).toBeInTheDocument()
    expect(screen.getByText('Donations')).toBeInTheDocument()
    expect(screen.getByText('Wallet')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders logo with Mawaddah branding', () => {
    render(<AdminLayout />)
    
    expect(screen.getByText('Mawaddah')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument() // Logo letter
  })

  it('renders theme toggle button', () => {
    render(<AdminLayout />)
    
    const themeButton = screen.getByTitle(/switch to/i)
    expect(themeButton).toBeInTheDocument()
  })

  it('renders user info in topbar', () => {
    render(<AdminLayout />)
    
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@mawaddah.com')).toBeInTheDocument()
  })

  it('renders user avatar', () => {
    render(<AdminLayout />)
    
    const avatar = screen.getByAltText('Admin User')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', '/avatar.jpg')
  })

  it('applies hover effects to navigation items', () => {
    render(<AdminLayout />)
    
    const appealsLink = screen.getByText('Appeals').closest('a')
    expect(appealsLink).toHaveClass('hover:bg-gray-50')
    expect(appealsLink).toHaveClass('hover:text-gray-900')
  })

  it('renders theme toggle button with correct icons', () => {
    render(<AdminLayout />)
    
    const themeButton = screen.getByTitle(/switch to/i)
    expect(themeButton).toBeInTheDocument()
    
    // Should show moon icon in light mode or sun icon in dark mode
    const icon = themeButton.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies dark mode classes correctly', () => {
    render(<AdminLayout />)
    
    // Check that dark mode classes are applied to the main container
    const mainContainer = document.querySelector('.min-h-screen')
    expect(mainContainer).toHaveClass('dark:bg-gray-900')
  })

  it('renders navigation links with correct hrefs', () => {
    render(<AdminLayout />)
    
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    const appealsLink = screen.getByText('Appeals').closest('a')
    const donationsLink = screen.getByText('Donations').closest('a')
    
    expect(dashboardLink).toHaveAttribute('href', '/admin')
    expect(appealsLink).toHaveAttribute('href', '/admin/appeals')
    expect(donationsLink).toHaveAttribute('href', '/admin/donations')
  })

  it('renders sidebar with proper structure', () => {
    render(<AdminLayout />)
    
    // Check that sidebar contains navigation
    const nav = screen.getByText('Dashboard').closest('nav')
    expect(nav).toBeInTheDocument()
    
    // Check that all navigation items are links
    const navLinks = nav.querySelectorAll('a')
    expect(navLinks).toHaveLength(6) // Dashboard, Appeals, Donations, Wallet, Users, Settings
  })

  it('renders topbar with proper structure', () => {
    render(<AdminLayout />)
    
    // Check that user info is in the topbar
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@mawaddah.com')).toBeInTheDocument()
    
    // Check that theme toggle is present
    expect(screen.getByTitle(/switch to/i)).toBeInTheDocument()
  })
}) 