// ❌ Legacy component – replaced by shadcn/ui
import React from 'react';

/**
 * Shared Dropdown component styled to match Input fields.
 * @param {object} props
 * @param {string} props.id
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {string} [props.theme] - 'light' | 'dark'
 * @param {React.ReactNode} [props.icon] - Optional icon to show inside the dropdown
 * @param {React.ReactNode[]} props.children - <option> elements
 */
const Dropdown = React.forwardRef(({ id, className = '', disabled = false, theme = 'light', icon, children, ...props }, ref) => {
  const baseBg = theme === 'dark' ? 'bg-[#374151]' : 'bg-gray-100';
  const baseBorder = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const baseText = theme === 'dark' ? 'text-[#FDFDFD]' : 'text-gray-900';
  const placeholderColor = theme === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400';
  const disabledBg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200';
  const disabledText = 'text-gray-400';
  const iconPadding = icon ? 'pl-11' : 'pl-4';

  return (
    <div className={`relative w-full`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
          {icon}
        </span>
      )}
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-disabled={disabled}
        className={`w-full appearance-none ${baseBg} ${baseBorder} ${baseText} ${placeholderColor} border rounded-lg ${iconPadding} pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A7F55] transition-colors ${disabled ? disabledBg + ' ' + disabledText + ' cursor-not-allowed' : ''} ${className}`}
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        {children}
      </select>
      {/* Custom arrow */}
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white flex items-center">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
});

export default Dropdown; 