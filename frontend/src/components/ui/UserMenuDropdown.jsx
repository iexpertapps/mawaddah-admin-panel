import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, User } from 'lucide-react';

// ✅ Import fallback image
import MawaddahLogo from '/ic_mawaddah_180x180.png';

export default function UserMenuDropdown({ user, onLogout, onAccount }) {
  const avatar = user?.avatar || MawaddahLogo;

  return (
    <Menu as="div" className="relative inline-block text-left">
      {/* Button */}
      <Menu.Button className="flex items-center focus:outline-none">
        <img
          src={avatar}
          alt={user?.name || 'Admin'}
          className="h-12 w-12 rounded-full border-2 border-primary shadow object-cover"
        />
      </Menu.Button>

      {/* Dropdown */}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-64 p-4 bg-white dark:bg-gray-900 shadow-xl rounded-xl focus:outline-none z-50">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-2">
            <img
              src={avatar}
              alt={user?.name || 'Admin'}
              className="h-14 w-14 rounded-full border-2 border-primary shadow object-cover"
            />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {user?.name || 'Admin User'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email || 'admin@mawaddah.com'}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* Menu Items */}
          <div className="flex flex-col gap-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onAccount}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 rounded-md transition-colors duration-150 text-gray-700 dark:text-gray-200 ${
                    active ? 'bg-primary/10' : ''
                  }`}
                >
                  <User className="w-4 h-4" />
                  Account
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onLogout}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 rounded-md transition-colors duration-150 text-gray-700 dark:text-gray-200 ${
                    active ? 'bg-primary/10' : ''
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
