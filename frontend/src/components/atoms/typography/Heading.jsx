import React from 'react'

export const Heading = ({ 
  children, 
  size = 'md', 
  as = 'h2',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    'xs': 'text-xs font-semibold',
    'sm': 'text-sm font-semibold',
    'md': 'text-base font-semibold',
    'lg': 'text-lg font-semibold',
    'xl': 'text-xl font-bold',
    '2xl': 'text-2xl font-bold',
    '3xl': 'text-3xl font-bold',
    '4xl': 'text-4xl font-bold',
    '5xl': 'text-5xl font-bold'
  }

  const Component = as

  return (
    <Component 
      className={`${sizeClasses[size]} text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
} 