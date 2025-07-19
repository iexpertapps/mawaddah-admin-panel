import React from 'react';

/**
 * Accessible, animated toggle switch
 * @param {object} props
 * @param {boolean} props.checked
 * @param {function} props.onChange
 * @param {string} [props.id]
 * @param {string} [props.className]
 * @param {object} [props.style]
 * @param {'left'|'right'} [props.align] - Alignment of the switch (default: 'left')
 */
const Switch = ({ checked, onChange, id, className = '', style = {}, align = 'left', ...rest }) => {
  return (
    <label
      className={`inline-flex items-center select-none ${align === 'right' ? 'flex-row-reverse justify-between' : ''} cursor-pointer ${className}`}
      style={style}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        id={id}
        tabIndex={0}
        aria-checked={checked}
        role="switch"
        {...rest}
      />
      <div
        className={`w-10 h-6 rounded-full relative transition-colors duration-200 ease-in-out
          ${checked ? 'bg-[#1A7F55]' : 'bg-gray-200'}
          peer-focus:ring-2 peer-focus:ring-[#1A7F55] peer-focus:ring-offset-2
        `}
        aria-hidden="true"
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-4' : ''}
          `}
        />
      </div>
    </label>
  );
};

export default Switch; 