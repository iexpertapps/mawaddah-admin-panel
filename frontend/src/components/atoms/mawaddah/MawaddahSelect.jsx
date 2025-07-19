import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * MawaddahSelect - Brand-aligned, accessible select/dropdown
 * Props: options [{label, value}], value, onChange, label, placeholder, error, helperText, className
 */
const MawaddahSelect = ({
  options = [],
  value,
  onChange,
  label,
  placeholder = 'Select...',
  error,
  helperText,
  className = '',
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={`w-full ${className}`} style={{ minHeight: 56 }}>
      {label && (
        <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 py-1">
          {label}
        </label>
      )}
      <div className="relative" ref={ref}>
        <button
          type="button"
          className={`w-full bg-muted dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 pr-10 pl-4 text-base text-gray-900 dark:text-white text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${error ? 'border-red-500' : ''}`}
          onClick={() => setOpen((v) => !v)}
          {...props}
        >
          {options.find((opt) => opt.value === value)?.label || <span className="text-gray-400">{placeholder}</span>}
        </button>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </span>
        {open && (
          <ul className="absolute z-10 mt-1 w-full bg-muted dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((opt) => (
              <li
                key={opt.value}
                className={`px-4 py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900 ${opt.value === value ? 'bg-primary-50 dark:bg-primary-800' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default MawaddahSelect; 