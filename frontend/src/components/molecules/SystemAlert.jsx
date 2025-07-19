import React from 'react'
import { Heading, Text } from '../atoms/typography'
import { InformationCircleIcon, ExclamationTriangleIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'

const typeMap = {
  info: {
    bg: 'bg-yellow-50 dark:bg-yellow-900',
    icon: InformationCircleIcon,
    text: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-200 dark:border-yellow-700',
    status: '🟢',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-900',
    icon: ExclamationTriangleIcon,
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-200 dark:border-orange-700',
    status: '🟡',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900',
    icon: XCircleIcon,
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-700',
    status: '🔴',
  }
}

const SystemAlert = ({ type = 'info', message, lastUpdated, badges = [], quote, alerts = [] }) => {
  const { bg, icon: Icon, text, border, status } = typeMap[type] || typeMap.info
  return (
    <div className={`flex flex-col md:flex-row md:items-center gap-4 rounded-xl p-4 border ${bg} ${border} bg-gray-50 dark:bg-gray-800 shadow-sm animate-fade-in relative`}>
      <div className="flex items-center gap-3 min-w-[120px]">
        <span className="text-2xl">{status}</span>
        <Icon className={`w-6 h-6 ${text}`} />
        <Heading level={4} className={`${text} mb-0`}>System Health & Alerts</Heading>
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${type === 'info' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{type === 'info' ? 'All Systems Operational' : type === 'warning' ? '1 Warning' : 'Error'}</span>
        </div>
        <Text className={text}>{message}</Text>
        {alerts && alerts.length > 0 && (
          <ul className="mt-2 space-y-1">
            {alerts.map((alert, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span>{alert.severity === 'error' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🟠'}</span>
                <span>{alert.message}</span>
                {alert.tag && <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold dark:bg-yellow-900 dark:text-yellow-200">{alert.tag}</span>}
              </li>
            ))}
          </ul>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {badges.map((badge, i) => (
              <span key={i} className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color} bg-opacity-10 border border-opacity-20`}>{badge.label}</span>
            ))}
          </div>
        )}
        {lastUpdated && (
          <Text size="xs" muted className="mt-1">Last updated: {lastUpdated}</Text>
        )}
        {quote && (
          <div className="mt-4 mb-4 flex flex-col items-end">
            <div className="w-full flex justify-center mb-2">
              <span className="text-2xl text-primary/60 select-none">﷽</span>
            </div>
            <div className="p-3 border-l-4 border-primary/40 bg-primary/5 dark:bg-primary/10 rounded-md flex items-start gap-2 w-full">
              <SparklesIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <Text italic className="text-gray-700 dark:text-gray-200">{quote.text}</Text>
                <Text size="xs" muted className="mt-1">{quote.source}</Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemAlert 