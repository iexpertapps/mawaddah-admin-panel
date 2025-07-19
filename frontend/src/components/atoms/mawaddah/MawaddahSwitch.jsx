import React from 'react';

/**
 * MawaddahSwitch - Accessible, animated, brand-aligned switch
 * Props: checked, onChange, label, id, disabled, className
 */
const MawaddahSwitch = ({ checked, onChange, label, id, disabled, className = '' }) => (
  <div className={`flex flex-col items-start ${className}`}>
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
        {label}
      </label>
    )}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 focus:outline-none
        ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow
          transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-1'}
        `}
      />
    </button>
  </div>
);

export default MawaddahSwitch; 