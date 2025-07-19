import React from 'react'
import { Heading, Text } from '../atoms/typography'

const StatCard = ({ icon, title, value, subtext, highlight = false, trend, large = false, iconClass = '', className = '', loading = false, error = null, onClick }) => {
  // Card base styles
  const base = `${large ? 'p-6 sm:p-8 min-h-[160px]' : 'p-4 sm:p-5'} rounded-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-md flex items-center justify-between gap-4 h-full`
  const highlightStyles = highlight
    ? 'bg-primary/10 ring-1 ring-primary/30 dark:bg-slate-800 dark:ring-primary/20'
    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700'

  // Determine if value is a valid number (including 0, but not NaN)
  const isValidNumber = typeof value === 'number' && !isNaN(value)

  return (
    <div 
      className={`${base} ${highlightStyles} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`flex flex-col items-center justify-center flex-shrink-0 ${large ? 'p-4' : 'p-3'} rounded-full bg-primary/10 dark:bg-primary/20 ${iconClass}`}>
        {React.isValidElement(icon) ? icon : icon ? React.createElement(icon, { className: "w-6 h-6 text-primary" }) : null}
      </div>
      <div className="flex-1 text-right">
        <Text size={large ? 'md' : 'sm'} muted>{title}</Text>
        <div className="flex items-center justify-end gap-2 min-h-[2.5rem]">
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : error ? (
            <div className="text-gray-400 text-lg">—</div>
          ) : value ? (
            <Heading size={large ? '4xl' : highlight ? '3xl' : 'xl'}>{value}</Heading>
          ) : (
            <div className="text-gray-400 text-lg">—</div>
          )}
          {trend && !loading && !error && value && (
            <span className={`inline-flex items-center text-xs font-semibold ${trend.up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.up ? '▲' : '▼'} {trend.value}
            </span>
          )}
        </div>
        {/* No 'Data unavailable' label */}
        {!loading && !error && value && subtext && (
          <Text size="xs" muted>{subtext}</Text>
        )}
      </div>
    </div>
  )
}

export default StatCard 