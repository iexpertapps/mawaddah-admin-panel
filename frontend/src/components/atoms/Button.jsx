// ❌ Legacy component – replaced by shadcn/ui
import React from 'react'

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500/50 dark:bg-green-600 dark:hover:bg-green-700',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500/50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500/50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500/50 dark:text-gray-200 dark:hover:bg-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
} 

export default Button; 