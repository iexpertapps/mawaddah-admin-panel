import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  WalletIcon,
  UserGroupIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Heading, Text } from '../atoms/typography'
import UserMenuDropdown from '../ui/UserMenuDropdown';

// Sidebar component
const Sidebar = () => {
  const location = useLocation()
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Donations', href: '/admin/donations', icon: CurrencyDollarIcon },
    { name: 'Appeals', href: '/admin/appeals', icon: ClipboardDocumentListIcon },
    { name: 'Wallet', href: '/admin/wallet', icon: WalletIcon },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon },
  ]
  return (
    <aside className="hidden lg:flex flex-col w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center h-20 px-6 border-b border-gray-200 dark:border-gray-700">
        <img src="/ic_mawaddah_180x180.png" alt="Mawaddah Logo" className="h-10 w-10 rounded-xl object-contain select-none" draggable="false" />
        <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">Mawaddah</span>
      </div>
      <nav className="mt-6 flex-1 px-3 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`group flex items-center px-4 py-2 text-base font-medium rounded-lg transition-all duration-200 gap-3 ${isActive ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-md dark:bg-primary/20 dark:text-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary'}`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'text-primary drop-shadow-[0_0_6px_rgba(26,127,85,0.4)]' : 'text-gray-400 group-hover:text-primary dark:text-gray-500 dark:group-hover:text-primary'}`} />
              {item.name}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

// Topbar component
const Topbar = ({ pageTitle }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between h-20 px-6 md:px-8">
      <Heading level={2} className="text-xl font-semibold text-gray-900 dark:text-white">
        {pageTitle}
      </Heading>
      <div className="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors duration-200"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (Ctrl+J)`}
        >
          {theme === 'light' ? (
            <MoonIcon className="w-5 h-5" />
          ) : (
            <SunIcon className="w-5 h-5" />
          )}
        </button>
        <UserMenuDropdown
          user={user}
          onLogout={logout}
          onAccount={() => navigate('/admin/profile')}
        />
      </div>
    </header>
  );
}

const AdminLayout = ({ pageTitle = 'Admin', children }) => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, token, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-slate-800 dark:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Right side: Topbar + Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <Topbar pageTitle={pageTitle} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 pt-6 pb-12">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout 