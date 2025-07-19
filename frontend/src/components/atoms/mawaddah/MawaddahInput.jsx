import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * MawaddahInput - Brand-aligned, accessible input component
 * Props: all standard input props, plus optional label, error, helperText
 */
const MawaddahInput = React.forwardRef(({ label, error, helperText, leftIcon, rightIcon, className = '', type = 'text', isDirty, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  // Remove isDirty from props passed to input, and ensure value is always defined
  const { value, ...restProps } = props;
  const safeValue = value !== undefined && value !== null ? value : '';
  const hasRightElement = isPassword || rightIcon;
  return (
    <div className={`w-full ${className}`} style={{ minHeight: 56 }}>
      {label && (
        <label htmlFor={props.id || props.name} className="block text-left text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 py-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center" style={{ height: 44 }}>
        {leftIcon && (
          <span className="absolute left-3 flex items-center justify-center bg-pink-200/70" style={{ height: 24, width: 24, top: '50%', transform: 'translateY(-50%)' }}>
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 ${hasRightElement ? 'pr-12' : 'pr-4'} text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${leftIcon ? 'pl-12' : 'pl-4'} ${error ? 'border-red-500' : ''}`}
          placeholder={props.placeholder}
          value={safeValue}
          {...restProps}
        />
        {/* Password eye icon */}
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 flex items-center justify-center text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 focus:outline-none"
            style={{ height: 24, width: 24, top: '50%', transform: 'translateY(-50%)' }}
            tabIndex={0}
            onClick={() => setShowPassword(v => !v)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        {/* Custom right icon if not password */}
        {!isPassword && rightIcon && (
          <span className="absolute right-3 flex items-center justify-center" style={{ height: 24, width: 24, top: '50%', transform: 'translateY(-50%)' }}>
            {rightIcon}
          </span>
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
});

export default MawaddahInput; 