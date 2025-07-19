// ❌ Legacy component – replaced by shadcn/ui
import React, { useState } from 'react';
import { EditIcon } from './Icons';

const INPUT_BG = 'bg-[#374151]';
const DISABLED_BG = 'bg-gray-700';
const PLACEHOLDER_COLOR = 'placeholder-[#fafbfb]';
const TEXT_COLOR = 'text-[#FDFDFD]';

const Input = React.forwardRef(({
  icon,
  rightIcon,
  className = '',
  placeholder = '',
  masked = false,
  value,
  onChange,
  onEdit,
  disabled = false,
  readOnly = false,
  isDirty = false,
  theme = 'light', // 'light' | 'dark'
  type = 'text',
  error,
  errorMessage,
  ...props
}, ref) => {
  const [editMode, setEditMode] = useState(false);
  const isSensitive = masked;
  const showMasked = isSensitive && !editMode;

  // Only apply custom bg for text-like fields
  const isTextLike = ['text', 'number', 'password', 'email', 'url', 'search'].includes(type);
  const baseBg = isTextLike ? INPUT_BG : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100');
  const baseBorder = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const baseText = isTextLike ? TEXT_COLOR : (theme === 'dark' ? 'text-gray-100' : 'text-gray-900');
  const placeholderColor = isTextLike ? PLACEHOLDER_COLOR : (theme === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400');
  const disabledBg = isTextLike ? DISABLED_BG : (theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200');
  const disabledText = 'text-gray-400';
  const dirtyHighlight = isDirty ? (theme === 'dark' ? 'ring-2 ring-green-700' : 'ring-2 ring-green-400') : '';
  const iconPadding = icon ? 'pl-11' : 'pl-4';
  const rightIconPadding = rightIcon ? 'pr-10' : '';

  // Remove error and errorMessage from props passed to input
  const inputProps = { ...props };
  delete inputProps.error;
  delete inputProps.errorMessage;

  return (
    <div className={`relative w-full`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        type={showMasked ? 'text' : type}
        value={showMasked ? '••••••' : value}
        onChange={showMasked ? undefined : onChange}
        placeholder={showMasked ? '' : placeholder}
        disabled={disabled || (isSensitive && !editMode)}
        readOnly={readOnly || (isSensitive && !editMode)}
        aria-label={props['aria-label'] || placeholder}
        aria-readonly={readOnly || (isSensitive && !editMode)}
        aria-disabled={disabled || (isSensitive && !editMode)}
        className={`w-full ${baseBg} ${baseBorder} ${baseText} ${placeholderColor} border rounded-lg ${iconPadding} ${rightIconPadding} py-2 focus:outline-none focus:ring-2 transition-colors ${dirtyHighlight} ${disabled || (isSensitive && !editMode) ? disabledBg + ' ' + disabledText + ' cursor-not-allowed' : ''} ${className} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        tabIndex={disabled || (isSensitive && !editMode) ? -1 : 0}
        {...inputProps}
      />
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none flex items-center">
          {rightIcon}
        </span>
      )}
      {/* Masked field edit icon */}
      {isSensitive && !editMode && !disabled && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 focus:outline-none"
          aria-label="Edit sensitive field"
          tabIndex={0}
          onClick={() => {
            setEditMode(true);
            if (onEdit) onEdit();
          }}
        >
          <EditIcon />
        </button>
      )}
      {/* Error message */}
      {errorMessage && (
        <div className="mt-1 text-xs text-red-500">{errorMessage}</div>
      )}
    </div>
  );
});

export default Input; 