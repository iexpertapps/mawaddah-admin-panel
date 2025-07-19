// ❌ Legacy component – replaced by shadcn/ui
import React from 'react';

/**
 * @typedef {object} CardProps
 * @property {string} [className]
 * @property {object} [style]
 * @property {string} [as]
 * @property {React.ReactNode} [children]
 */

/**
 * @type {React.FC<CardProps>}
 */
const Card = ({ className = '', style = {}, as = 'div', children, ...rest }) => {
  const Tag = as;
  return (
    <Tag
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Card; 