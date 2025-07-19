import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900 px-4">
      <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">404 – Page Not Found</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">Sorry, the page you’re looking for doesn’t exist.</p>
      <button
        onClick={() => navigate('/admin')}
        className="px-6 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-dark transition"
      >
        Go to Dashboard
      </button>
    </div>
  )
}

export default NotFound 