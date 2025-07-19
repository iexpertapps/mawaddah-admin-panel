import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const Drawer = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Semi-transparent overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      {/* Drawer Panel - slides from right */}
      <div className="ml-auto w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export default Drawer 