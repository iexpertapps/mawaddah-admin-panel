import React from 'react'

// Base skeleton component with shimmer animation
const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    {...props}
  />
)

// Skeleton for table rows
export const SkeletonTableRow = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700">
    <Skeleton className="h-4 w-4" />
    <Skeleton className="h-4 flex-1" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-8 w-16" />
  </div>
)

// Skeleton for table
export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  </div>
)

// Skeleton for stat cards
export const SkeletonStatCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-h-[120px]">
    <div className="flex items-center justify-between">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 text-right">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  </div>
)

// Skeleton for stats grid
export const SkeletonStats = () => (
  <div className="flex flex-wrap gap-4 w-full">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex-1 min-w-[200px] max-w-[300px]">
        <SkeletonStatCard />
      </div>
    ))}
  </div>
)

export default Skeleton 