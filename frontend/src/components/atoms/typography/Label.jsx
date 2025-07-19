// ❌ Legacy component – replaced by shadcn/ui
import React from 'react'

export const Label = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const variantClasses = {
    'default': 'text-gray-700 dark:text-gray-300 font-medium',
    'badge': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-xs font-medium',
    'success': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md text-xs font-medium',
    'warning': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-md text-xs font-medium',
    'error': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-md text-xs font-medium',
    'info': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md text-xs font-medium'
  }

  const sizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'md': 'text-sm',
    'lg': 'text-base'
  }

  return (
    <span 
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
} 