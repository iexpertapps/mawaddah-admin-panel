import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error if needed
    // console.error(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900 px-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Unexpected Application Error</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-300">Something went wrong. Please try reloading the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-dark transition"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary 