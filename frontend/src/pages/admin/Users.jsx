import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Heading, Text } from '../../components/atoms/typography'
import { Button } from '../../components/atoms'
import StatCard from '../../components/molecules/StatCard'
import AdminLayout from '../../components/layout/AdminLayout'
import useAuth from '../../context/useAuth'
import AdminTable from '../../components/molecules/AdminTable'
import { format, formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import Drawer from '../../components/molecules/Drawer'
import Modal from '../../components/molecules/Modal'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Enhanced useUsers hook with stable caching and dynamic filtering
const useUsers = (filters = {}, activeFilter = 'all', page = 1, pageSize = 10) => {
  const { token } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    // Build query params from filters
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);
    // Role filter
    if (activeFilter === 'donors') params.append('role', 'donor');
    else if (activeFilter === 'recipients') params.append('role', 'recipient');
    else if (activeFilter === 'shura') params.append('role', 'shura');
    else if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    // Search filter
    if (filters.search) params.append('search', filters.search);
    // Verified Syed filter
    if (filters.verifiedSyed !== undefined) params.append('is_verified_syed', filters.verifiedSyed);
    let url = `/api/users/?${params.toString()}`;
    fetch(url, {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(usersData => {
        const users = Array.isArray(usersData.results) ? usersData.results : usersData;
        setAllUsers(users);
        setTotalCount(usersData.count || users.length);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, activeFilter, page, pageSize, filters.search, filters.role, filters.verifiedSyed]);

  // No more client-side filtering for search, role, or verifiedSyed
  return {
    users: allUsers,
    loading,
    error,
    totalCount,
    filteredCount: allUsers.length
  };
};

// Enhanced useUserStats hook with filtered counts
const useUserStats = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    allUsers: 0,
    donors: 0,
    recipients: 0,
    shuraMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const fetchUsers = (role = '') =>
      api.get(`/api/users/${role ? `?role=${role}` : ''}`).then((res) => res.data);

    Promise.all([
      fetchUsers(),
      fetchUsers('donor'),
      fetchUsers('recipient'),
      fetchUsers('shura')
    ])
      .then(([usersData, donorsData, recipientsData, shuraData]) => {
        setStats({
          allUsers: usersData.count ?? usersData.results?.length ?? 0,
          donors: donorsData.count ?? donorsData.results?.length ?? 0,
          recipients: recipientsData.count ?? recipientsData.results?.length ?? 0,
          shuraMembers: shuraData.count ?? shuraData.results?.length ?? 0
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return { stats, loading, error };
};



// Enhanced Filter Bar with Clear Filter button
const UserFilterBar = ({ filters, onFiltersChange, onAddUser, activeFilter, onClearFilter }) => {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const debouncedSearch = useDebounce(searchValue, 300)

  // Sync searchValue with filters.search when filters change externally
  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  useEffect(() => {
    onFiltersChange({ ...filters, search: debouncedSearch })
  }, [debouncedSearch, onFiltersChange])

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value)
  }

  const handleRoleChange = (e) => {
    onFiltersChange({ ...filters, role: e.target.value })
  }

  const handleVerifiedToggle = (e) => {
    onFiltersChange({ 
      ...filters, 
      verifiedSyed: e.target.checked ? true : undefined 
    })
  }

  // Only show Clear Filter if any filter is not at its default value (ignore activeFilter)
  const hasActiveFilters = (
    (filters.search && filters.search.trim() !== '') ||
    (filters.role && filters.role !== 'all') ||
    filters.verifiedSyed !== undefined
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone"
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filters.role}
              onChange={handleRoleChange}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none min-w-[140px]"
            >
              <option value="all">Filter by role</option>
              <option value="admin">Admin</option>
              <option value="shura">Shura</option>
              <option value="donor">Donor</option>
              <option value="recipient">Recipient</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Verified Syed Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verifiedSyed"
              checked={filters.verifiedSyed === true}
              onChange={handleVerifiedToggle}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="verifiedSyed" className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Verified Syed Only
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Clear Filter Button */}
          {hasActiveFilters && (
            <Button
              variant="secondary"
              onClick={onClearFilter}
              className="flex items-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear Filter
            </Button>
          )}

          {/* Add Shura Member Button */}
          <Button
            variant="primary"
            onClick={onAddUser}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Add Shura Member
          </Button>
        </div>
      </div>
    </div>
  )
}

// Enhanced Stat Card Component with brand color highlighting
const EnhancedStatCard = ({ icon, title, value, loading, error, highlight, onClick, filteredCount, totalCount, highlightColor = 'primary' }) => {
  const getHighlightClasses = () => {
    switch (highlightColor) {
      case 'donors':
        return highlight ? "border-2 border-[#1A7F55] bg-[#1A7F55]/5" : ""
      case 'recipients':
        return highlight ? "border-2 border-[#D4AF37] bg-[#D4AF37]/5" : ""
      case 'shura':
        return highlight ? "border-2 border-[#3B82F6] bg-[#3B82F6]/5" : ""
      default:
        return highlight ? "border-2 border-primary bg-primary/5" : ""
    }
  }
  
  const baseClasses = "bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all duration-200"
  const highlightClasses = getHighlightClasses()
  
  return (
    <div 
      className={`${baseClasses} ${highlightClasses}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          <div>
            <Text size="sm" muted className="mb-1">{title}</Text>
            {loading ? (
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
            ) : error ? (
              <Text size="lg" className="text-red-500">—</Text>
            ) : (
              <Text size="lg" className="font-semibold">{value}</Text>
            )}
            {/* Show filtered count if different from total */}
            {filteredCount !== undefined && filteredCount !== totalCount && (
              <Text size="xs" muted className="mt-1">
                Filtered: {filteredCount}
              </Text>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Add User Modal Component
const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuth()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'shura'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          password: 'temp_password_123', // Will be reset on first login
          password_confirm: 'temp_password_123',
          // force_password_reset: true // Remove if not used in backend
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create Shura Member')
      }

      const newUser = await response.json()
      onSuccess(newUser)
      onClose()
      setFormData({ first_name: '', last_name: '', email: '', phone: '', role: 'shura' })
    } catch (err) {
      setError('Failed to create Shura Member')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <Heading size="lg">Add Shura Member</Heading>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text size="sm" className="mb-1">First Name *</Text>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <Text size="sm" className="mb-1">Last Name *</Text>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <Text size="sm" className="mb-1">Email *</Text>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Text size="sm" className="mb-1">Phone</Text>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Text size="sm" className="mb-1">Role</Text>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="shura">Shura Member</option>
              <option value="admin">Admin</option>
              <option value="donor">Donor</option>
              <option value="recipient">Recipient</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <Text size="sm" className="text-red-600 dark:text-red-400">{error}</Text>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Users Table Component
const UsersTable = ({ users, loading, error, onView, onEdit, onResetPassword, totalCount, filteredCount }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-CA') // YYYY-MM-DD format
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Text muted>Error loading users: {error}</Text>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8">
        <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <Text muted>No users found</Text>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Full Name</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Phone</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Role</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Verified Syed</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Wallet Balance</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Created At</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="py-3 px-4">
                <div>
                  <Text className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim()}</Text>
                </div>
              </td>
              <td className="py-3 px-4">
                <Text>{user.email}</Text>
              </td>
              <td className="py-3 px-4">
                <Text>{user.phone || '—'}</Text>
              </td>
              <td className="py-3 px-4">
                {getRoleBadge(user.role)}
              </td>
              <td className="py-3 px-4">
                {user.is_verified_syed ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-gray-400" />
                )}
              </td>
              <td className="py-3 px-4">
                <Text>{formatCurrency(user.wallet_balance)}</Text>
              </td>
              <td className="py-3 px-4">
                <Text size="sm">{formatDate(user.created_at)}</Text>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(user)}
                    className="p-1 text-gray-400 hover:text-primary transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="p-1 text-gray-400 hover:text-primary transition-colors"
                    title="Edit User"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onResetPassword(user)}
                    className="p-1 text-gray-400 hover:text-primary transition-colors"
                    title="Reset Password"
                  >
                    <KeyIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Role badge utility (move to top-level scope)
const getRoleBadge = (role) => {
  const roleColors = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    shura: 'bg-primary/10 text-primary dark:bg-primary/20',
    donor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    recipient: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role] || roleColors.neutral}`}>
      {role}
    </span>
  )
}

// Currency formatting utility (move to top-level scope)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

function getPasswordStrength(password) {
  // Returns { level, color, label }
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  const levels = [
    { label: 'Too Weak', color: '#861657' },
    { label: 'Weak', color: '#D4AF37' },
    { label: 'Good', color: '#0E4C92' },
    { label: 'Strong', color: '#1A7F55' },
  ];
  if (score <= 1) return { ...levels[0], score };
  if (score === 2) return { ...levels[1], score };
  if (score === 3) return { ...levels[2], score };
  return { ...levels[3], score };
}

function humanizeError(msg) {
  if (!msg) return '';
  return msg
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\.$/, '');
}

function PasswordRequirements({ visible }) {
  if (!visible) return null;
  return (
    <ul className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded p-2 mt-1 border border-gray-200 dark:border-gray-700">
      <li>• At least 8 characters</li>
      <li>• At least 1 uppercase letter</li>
      <li>• At least 1 number</li>
      <li>• At least 1 special character</li>
    </ul>
  );
}

function ChangePasswordForm({ user, onSuccess }) {
  const { token } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReqs, setShowReqs] = useState(false);
  const formRef = useRef();

  const strength = getPasswordStrength(password);
  const confirmError = confirm && password !== confirm ? 'Passwords do not match' : '';

  const resetState = () => {
    setPassword('');
    setConfirm('');
    setError(null);
    setSuccess(false);
    setShowReqs(false);
  };

  // Reset state on modal close
  // (Assume parent will unmount this component on close, so useEffect not strictly needed)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.id}/set_password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        let extractedError = 'Failed to change password';
        try {
          const data = await res.json();
          if (Array.isArray(data?.password)) {
            extractedError = data.password.join(' ');
          } else if (typeof data?.password === 'string') {
            extractedError = data.password;
          } else if (data?.error) {
            extractedError = data.error;
          } else if (data?.detail) {
            extractedError = data.detail;
          }
        } catch {}
        setError(humanizeError(extractedError));
        setLoading(false);
        return;
      }
      setSuccess(true);
      resetState();
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" ref={formRef}>
      <div>
        <Text size="sm" className="mb-1">New Password</Text>
        <div className="w-full max-w-md space-y-1">
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
              onFocus={() => setShowReqs(true)}
              onBlur={() => setShowReqs(false)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {/* Strength Meter */}
          {password && (
            <div className="w-full flex flex-col gap-1">
              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-2 rounded transition-all duration-300 ease-in-out"
                  style={{ width: `${(strength.score / 3) * 100}%`, background: strength.color, maxWidth: '100%' }}
                />
              </div>
              <div className="flex justify-end w-full">
                <span className="text-sm text-right" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            </div>
          )}
          <PasswordRequirements visible={showReqs} />
        </div>
      </div>
      <div>
        <Text size="sm" className="mb-1">Confirm Password</Text>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(null); }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setShowConfirm(v => !v)}
            tabIndex={-1}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        {confirmError && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {confirmError}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-sm break-words whitespace-pre-line">
          <ExclamationTriangleIcon className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && <Text size="sm" className="text-green-600">Password changed successfully!</Text>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => { resetState(); onSuccess(); }} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={loading || !password || !confirm}>{loading ? 'Saving...' : 'Change Password'}</Button>
      </div>
    </form>
  );
}

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50];

const Users = () => {
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    verifiedSyed: undefined
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5);
  const [viewUser, setViewUser] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordUser, setPasswordUser] = useState(null)
  const navigate = useNavigate()

  const { stats, loading: statsLoading, error: statsError } = useUserStats()
  const { users, loading: usersLoading, error: usersError, totalCount, filteredCount } = useUsers(filters, activeFilter, page, pageSize);

  // Apply pagination to filtered users
  // const paginatedUsers = useMemo(() => {
  //   const start = (page - 1) * PAGE_SIZE
  //   return users.slice(start, start + PAGE_SIZE)
  // }, [users, page])

  const handleStatCardClick = useCallback((filter) => {
    setActiveFilter(filter)
    setPage(1) // Reset to first page when changing filters
    // Reset other filters when clicking stat cards
    setFilters({ search: '', role: 'all', verifiedSyed: undefined })
  }, [])

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when changing filters
    setActiveFilter('custom') // Reset active filter when user manually changes filters
  }, [])

  const handleClearFilter = useCallback(() => {
    setActiveFilter('all')
    setPage(1) // Reset to first page when clearing filters
    setFilters({ search: '', role: 'all', verifiedSyed: undefined })
  }, [])

  const handleAddUserSuccess = (newUser) => {
    // Refresh the users list
    window.location.reload()
  }

  const handleViewUser = (user) => {
    // TODO: Implement user detail view
  }

  const handleEditUser = (user) => {
    // TODO: Implement user edit
  }

  const handleResetPassword = (user) => {
    // TODO: Implement password reset
  }

  // Table columns definition
  const columns = [
    {
      key: 'fullName',
      title: 'Full Name',
      render: (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim()
    },
    {
      key: 'email',
      title: 'Email',
      render: (user) => user.email
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (user) => user.phone || '—'
    },
    {
      key: 'role',
      title: 'Role',
      render: (user) => getRoleBadge(user.role)
    },
    {
      key: 'is_verified_syed',
      title: 'Verified Syed',
      render: (user) => user.is_verified_syed ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <XCircleIcon className="w-5 h-5 text-gray-400" />
    },
    {
      key: 'wallet_balance',
      title: 'Wallet Balance',
      render: (user) => formatCurrency(user.wallet_balance)
    },
    {
      key: 'created_at',
      title: 'Created At',
      render: (user) => user.created_at ? `${format(new Date(user.created_at), 'dd MMM yyyy')} (${formatDistanceToNow(new Date(user.created_at), { addSuffix: true })})` : '—'
    },
    {
      key: 'last_login',
      title: 'Last Login',
      render: (user) => user.last_login ? `${format(new Date(user.last_login), 'dd MMM yyyy')} (${formatDistanceToNow(new Date(user.last_login), { addSuffix: true })})` : '—'
    }
  ]

  // Row actions
  const actions = [
    {
      label: 'View',
      icon: <EyeIcon className="w-4 h-4" />,
      onClick: (user) => setViewUser(user)
    },
    {
      label: 'Edit',
      icon: <PencilIcon className="w-4 h-4" />,
      onClick: (user) => navigate(`/admin/users/${user.id}/edit`)
    },
    {
      label: 'Change Password',
      icon: <KeyIcon className="w-4 h-4" />,
      onClick: (user) => { setPasswordUser(user); setShowPasswordModal(true) }
    }
  ]

  // Pagination handler
  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  // Page size handler
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1); // Reset to first page when page size changes
  }

  return (
    <>
      {/* Islamic Motif Header */}
      <div className="flex items-center justify-center mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <Heading size="lg" className="text-primary">📋 Users Management</Heading>
            <SparklesIcon className="w-5 h-5 text-primary" />
          </div>
          <Text size="sm" muted className="font-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        </div>
      </div>

      {/* Enhanced Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <EnhancedStatCard
          icon={<UserGroupIcon className="w-6 h-6" />}
          title="All Users"
          value={stats.allUsers}
          loading={statsLoading}
          error={statsError}
          highlight={activeFilter === 'all'}
          onClick={() => handleStatCardClick('all')}
          filteredCount={activeFilter === 'all' ? filteredCount : undefined}
          totalCount={totalCount}
          highlightColor="primary"
        />
        <EnhancedStatCard
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          title="Donors"
          value={stats.donors}
          loading={statsLoading}
          error={statsError}
          highlight={activeFilter === 'donors'}
          onClick={() => handleStatCardClick('donors')}
          filteredCount={activeFilter === 'donors' ? filteredCount : undefined}
          totalCount={stats.donors}
          highlightColor="donors"
        />
        <EnhancedStatCard
          icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
          title="Recipients"
          value={stats.recipients}
          loading={statsLoading}
          error={statsError}
          highlight={activeFilter === 'recipients'}
          onClick={() => handleStatCardClick('recipients')}
          filteredCount={activeFilter === 'recipients' ? filteredCount : undefined}
          totalCount={stats.recipients}
          highlightColor="recipients"
        />
        <EnhancedStatCard
          icon={<UsersIcon className="w-6 h-6" />}
          title="Shura Members"
          value={stats.shuraMembers}
          loading={statsLoading}
          error={statsError}
          highlight={activeFilter === 'shura'}
          onClick={() => handleStatCardClick('shura')}
          filteredCount={activeFilter === 'shura' ? filteredCount : undefined}
          totalCount={stats.shuraMembers}
          highlightColor="shura"
        />
      </div>

      {/* Enhanced Filter Bar */}
      <UserFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onAddUser={() => setShowAddModal(true)}
        activeFilter={activeFilter}
        onClearFilter={handleClearFilter}
      />

      {/* Enhanced Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <Heading size="lg">
                {activeFilter === 'all' ? 'Users' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`}
              </Heading>
              <Text size="sm" muted className="mt-1">
                Showing {filteredCount} of {totalCount} users
              </Text>
            </div>
            {usersLoading && (
              <Text size="sm" muted>Loading...</Text>
            )}
          </div>
        </div>
        <div className="p-6">
          <AdminTable
            columns={columns}
            data={users}
            loading={usersLoading}
            error={usersError}
            actions={actions}
            pagination={{
              page,
              pageSize,
              total: totalCount,
              onPageChange: handlePageChange
            }}
            pageSizeSelector={
              <div className="flex items-center gap-1 mr-4">
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  aria-label="Records per page"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-300">per page</span>
              </div>
            }
            emptyState="No users found matching your criteria."
            errorState="Something went wrong while loading users."
          />
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddUserSuccess}
      />

      {/* View User Drawer */}
      {viewUser && (
        <Drawer isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Profile">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <UserGroupIcon className="w-10 h-10 text-primary" />
              <div>
                <Text size="lg" className="font-semibold">{viewUser.first_name} {viewUser.last_name}</Text>
                <Text size="sm" muted>{viewUser.email}</Text>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Text size="sm" muted>Phone</Text><Text>{viewUser.phone || '—'}</Text></div>
              <div><Text size="sm" muted>Role</Text>{getRoleBadge(viewUser.role)}</div>
              <div><Text size="sm" muted>Verified Syed</Text>{viewUser.is_verified_syed ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <XCircleIcon className="w-5 h-5 text-gray-400" />}</div>
              <div><Text size="sm" muted>Wallet Balance</Text>{formatCurrency(viewUser.wallet_balance)}</div>
              <div><Text size="sm" muted>Created At</Text>{viewUser.created_at ? `${format(new Date(viewUser.created_at), 'dd MMM yyyy')} (${formatDistanceToNow(new Date(viewUser.created_at), { addSuffix: true })})` : '—'}</div>
              <div><Text size="sm" muted>Last Login</Text>{viewUser.last_login ? `${format(new Date(viewUser.last_login), 'dd MMM yyyy')} (${formatDistanceToNow(new Date(viewUser.last_login), { addSuffix: true })})` : '—'}</div>
            </div>
            {/* Add more user details/activity as needed */}
          </div>
        </Drawer>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordUser && (
        <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
          <ChangePasswordForm user={passwordUser} onSuccess={() => setShowPasswordModal(false)} />
        </Modal>
      )}
    </>
  )
}

export default Users 