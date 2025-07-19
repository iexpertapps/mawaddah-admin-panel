import React from 'react';

/**
 * MawaddahButton - Brand-aligned button for 'Add' and 'Save' actions
 * Props: children, onClick, type, variant ('add' | 'save'), className, loading, ...rest
 */
const VARIANTS = {
  add: 'bg-white text-primary border border-primary font-medium rounded-md shadow-sm hover:shadow-md focus:ring-2 focus:ring-primary transition-all',
  save: 'bg-primary text-white font-bold rounded-lg shadow-sm hover:shadow-lg focus:ring-2 focus:ring-primary transition-all',
};

const MawaddahButton = ({ children, onClick, type = 'button', variant = 'add', className = '', loading = false, ...rest }) => {
  // Remove 'loading' from rest so it doesn't go to the DOM
  const { loading: _loading, ...buttonProps } = rest;
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 ${VARIANTS[variant]} ${className}`}
      disabled={loading || rest.disabled}
      {...buttonProps}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
          <span>{typeof children === 'string' ? children : 'Loading...'}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default MawaddahButton; 