import React from 'react'
import { Text } from '../atoms/typography'
import { Button } from '../atoms'
import { UserGroupIcon, ExclamationCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import './AdminTable.css'; // Add this import for custom styles

const AdminTable = ({
  columns = [],
  data = [],
  loading = false,
  error = null,
  emptyState = 'No data found.',
  errorState = 'Something went wrong.',
  actions = [], // [{ label, icon, onClick, color, condition }]
  pagination = null, // { page, pageSize, total, onPageChange }
  pageSizeSelector = null // new prop
}) => {
  // Pagination logic
  let totalPages = 1;
  let currentPage = 1;
  if (pagination) {
    const total = typeof pagination.total === 'number' && pagination.total > 0 ? pagination.total : 1;
    const pageSize = typeof pagination.pageSize === 'number' && pagination.pageSize > 0 ? pagination.pageSize : 10;
    totalPages = Math.max(1, Math.ceil(total / pageSize));
    currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  }
  

  // Helper function to get visible actions for a row
  const getVisibleActions = (row) => {
    return actions.filter(action => {
      // If no condition is specified, always show the action
      if (!action.condition) return true
      // If condition is specified, check if it returns true for this row
      return action.condition(row)
    })
  }

  return (
    <div>
      <div className="relative overflow-x-auto w-full custom-scrollbar-hide">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-center align-middle py-3 px-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                  style={{ minWidth: col.minWidth || 0 }}
                >
                  {col.title}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="text-center align-middle py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)}>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse my-2" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)}>
                  <div className="flex flex-col items-center py-8">
                    <ExclamationCircleIcon className="w-10 h-10 text-red-400 mb-2" />
                    <Text muted>{errorState}</Text>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)}>
                  <div className="flex flex-col items-center py-8">
                    <UserGroupIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <Text muted>{emptyState}</Text>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const visibleActions = getVisibleActions(row)
                return (
                  <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    {columns.map((col) => (
                      <td key={col.key} className="text-center align-middle py-3 px-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="text-center align-middle py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {visibleActions.map((action, aidx) => (
                            <Button
                              key={aidx}
                              variant={action.color || 'secondary'}
                              size="icon"
                              onClick={() => action.onClick(row)}
                              title={action.label}
                            >
                              {action.icon}
                            </Button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Always show page size selector and pagination controls */}
      {pagination && (
        <div className="flex items-center justify-end gap-2 mt-4">
          {pageSizeSelector}
          <Button
            variant="secondary"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => pagination.onPageChange(currentPage - 1)}
            aria-label="Previous Page"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <Text size="sm" muted>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            variant="secondary"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => pagination.onPageChange(currentPage + 1)}
            aria-label="Next Page"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default AdminTable 