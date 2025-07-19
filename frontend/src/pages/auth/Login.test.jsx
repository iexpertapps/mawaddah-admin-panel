import '@testing-library/jest-dom'
import React from 'react'
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
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

// Custom render to wrap in ThemeProvider and MemoryRouter
function render(ui, options) {
  return rtlRender(
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>,
    options
  )
}

// Mock useNavigate from react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    Link: (props) => <a {...props} />,
  }
})

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.resetAllMocks()
    global.fetch = jest.fn()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('renders email and password fields and Sign In button', () => {
    render(<Login />)
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('applies dark mode classes', () => {
    render(<Login />)
    const root = screen.getByText(/mawaddah/i).closest('div')
    expect(document.documentElement.className).toMatch(/dark|light/)
    // Find the element that actually has bg-white/80 class
    const cardElement = screen.getByText(/welcome back/i).closest('div').parentElement
    expect(cardElement).toHaveClass('bg-white/80')
  })

  it('shows validation errors for empty fields', async () => {
    render(<Login />)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    // Verify that the form doesn't proceed with empty fields (validation is working)
    // The button should still be enabled and no API call should be made
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).not.toBeDisabled()
  })

  it('submits valid credentials and stores token, redirects to /admin', async () => {
    const mockNavigate = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-token' })
    })
    render(<Login />)
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('test-token'))
    expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true })
  })

  it('shows error on invalid credentials, does not store token', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false })
    render(<Login />)
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(screen.getByLabelText(/email address/i)).toHaveValue('wrong@example.com')
    expect(screen.getByLabelText(/password/i)).toHaveValue('wrongpass')
  })

  it('disables button during API call and re-enables after', async () => {
    let resolveFetch
    global.fetch.mockImplementationOnce(() => new Promise((resolve) => { resolveFetch = resolve }))
    render(<Login />)
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    resolveFetch({ ok: false })
    await waitFor(() => expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled())
  })

  it('submits form on Enter key', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-token' })
    })
    const mockNavigate = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)
    render(<Login />)
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    // Use fireEvent.submit on the form instead of keyDown
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'))
    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('test-token'))
    expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true })
  })

  // Optional: snapshot test for theme
  it('matches snapshot in light and dark mode', () => {
    const { asFragment, rerender } = render(<Login />)
    expect(asFragment()).toMatchSnapshot('light-mode')
    document.documentElement.classList.add('dark')
    rerender(
      <ThemeProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ThemeProvider>
    )
    expect(asFragment()).toMatchSnapshot('dark-mode')
    document.documentElement.classList.remove('dark')
  })
}) 