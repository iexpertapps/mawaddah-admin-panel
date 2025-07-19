import React from 'react';

const Textarea = React.forwardRef(({
  className = '',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  readOnly = false,
  isDirty = false,
  theme = 'light', // 'light' | 'dark'
  ...props
}, ref) => {
  const baseBorder = 'border border-gray-300 dark:border-gray-600';
  const baseBg = 'bg-white dark:bg-gray-800';
  const baseText = 'text-base text-gray-900 dark:text-white';
  const placeholderColor = 'placeholder-gray-400 dark:placeholder-gray-500';
  const rounded = 'rounded-md';
  const padding = 'px-3 py-2';
  const focusRing = 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';
  const transition = 'transition-all duration-200';
  const disabledStyle = 'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed';
  const dirtyHighlight = isDirty ? (theme === 'dark' ? 'ring-2 ring-green-700' : 'ring-2 ring-green-400') : '';

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      aria-label={props['aria-label'] || placeholder}
      aria-readonly={readOnly}
      aria-disabled={disabled}
      className={`w-full ${baseBorder} ${baseBg} ${baseText} ${placeholderColor} ${rounded} ${padding} ${focusRing} ${transition} ${dirtyHighlight} ${disabledStyle} ${className}`}
      tabIndex={disabled ? -1 : 0}
      {...props}
    />
  );
});

export default Textarea; 