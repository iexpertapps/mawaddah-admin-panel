import React from 'react'

export const Text = ({ 
  children, 
  size = 'md',
  as = 'p',
  muted = false,
  className = '',
  italic = false,
  ...props 
}) => {
  const sizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl'
  }

  const colorClasses = muted 
    ? 'text-gray-500 dark:text-gray-400' 
    : 'text-gray-700 dark:text-gray-300'

  const Component = as

  return (
    <Component 
      className={`${sizeClasses[size]} ${colorClasses} ${className} ${italic ? 'italic' : ''}`}
      {...props}
    >
      {children}
    </Component>
  )
} 