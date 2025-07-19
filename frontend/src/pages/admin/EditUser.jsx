import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Switch } from '../../components/atoms';
import Skeleton from '../../components/atoms/Skeleton';
import { AlertTriangle } from 'lucide-react';
import { Heading, Text } from '../../components/atoms/typography';
import { useAuth } from '../../hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'shura', label: 'Shura' },
  { value: 'donor', label: 'Donor' },
  { value: 'recipient', label: 'Recipient' },
];

function validateForm(form) {
  const errors = {};
  if (!form.first_name.trim()) errors.first_name = 'First name is required.';
  if (!form.last_name.trim()) errors.last_name = 'Last name is required.';
  // Role business rules
  const hasAdmin = form.roles.includes('admin');
  const hasShura = form.roles.includes('shura');
  const hasRecipient = form.roles.includes('recipient');
  if ((hasAdmin && hasRecipient)) errors.roles = 'Cannot assign both Admin and Recipient roles.';
  if ((hasShura && hasRecipient)) errors.roles = 'Cannot assign both Shura and Recipient roles.';
  return errors;
}

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score === 0) return { level: 'Weak', color: 'bg-orange-400' };
  if (score === 1) return { level: 'Weak', color: 'bg-orange-400' };
  if (score === 2) return { level: 'Medium', color: 'bg-yellow-400' };
  if (score >= 3) return { level: 'Strong', color: 'bg-green-500' };
}

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // Assume currentUser is admin (enforced by route)
  const isAdmin = true;

  useEffect(() => {
    if (!id || !token) return;
    setLoading(true);
    setError(null);
    fetch(`/api/users/${id}/`, {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          roles: Array.isArray(data.roles) ? data.roles : data.roles ? [data.roles] : [],
          is_active: data.is_active ?? true,
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, token]);

  function handleBlur(field) {
    setErrors(prev => ({ ...prev, [field]: validateForm(form)[field] }));
  }

  function handleRolesChange(roleValue) {
    setForm(f => {
      const roles = f.roles.includes(roleValue)
        ? f.roles.filter(r => r !== roleValue)
        : [...f.roles, roleValue];
      return { ...f, roles };
    });
    setErrors(prev => ({ ...prev, roles: validateForm({ ...form, roles: form.roles.includes(roleValue) ? form.roles.filter(r => r !== roleValue) : [...form.roles, roleValue] }).roles }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setSubmitting(true);
    // Only send changed fields
    const changed = {};
    for (const key of Object.keys(form)) {
      if (form[key] !== user[key]) changed[key] = form[key];
    }
    try {
      const res = await fetch(`/api/users/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changed),
      });
      if (!res.ok) throw new Error('Failed to update user.');
      const updated = await res.json();
      setUser(updated);
      setSubmitting(false);
      toast.success('User updated successfully.', {
        icon: <CheckCircle className="text-green-600" />, position: 'top-right', duration: 4000, ariaLive: 'polite', className: 'rounded-xl shadow-lg', closeButton: true
      });
      // Redirect back to Users page after a short delay to show the success message
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      setSubmitting(false);
      toast.error('Failed to update user.', {
        icon: <AlertTriangle className="text-red-400" />, position: 'top-right', duration: 4000, ariaLive: 'polite', className: 'rounded-xl shadow-lg', closeButton: true
      });
    }
  }

  function validatePasswordFields() {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setResetSubmitting(true);
    try {
      const res = await fetch(`/api/users/${id}/set_password/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to change password";
        try {
          const data = await res.json();
          
          if (Array.isArray(data?.password)) {
            errorMsg = data.password.join(" ");
          } else if (data?.password) {
            errorMsg = data.password;
          } else if (data?.error) {
            errorMsg = data.error;
          } else if (data?.detail) {
            errorMsg = data.detail;
          }
        } catch (parseError) {
          console.error("❌ Error parsing response:", parseError);
        }
        
        toast.error(errorMsg);
        setResetSubmitting(false);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setShowReset(false);
      setResetSubmitting(false);
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("❌ Network error:", error);
      toast.error("Failed to change password");
      setResetSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <Skeleton className="w-1/3 h-6 rounded-xl bg-muted animate-pulse" />
            <Skeleton className="w-1/2 h-4 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
        <Skeleton className="w-full h-10 rounded-xl bg-muted animate-pulse" />
        <Skeleton className="w-full h-10 rounded-xl bg-muted animate-pulse" />
        <Skeleton className="w-1/2 h-10 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
        <Text className="text-red-500">Unable to load user. Please try again.</Text>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!user || !form) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-primary font-medium hover:underline mb-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-colors"
        aria-label="Back to Users"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Users
      </button>
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-2">
        <span className="cursor-pointer hover:underline" onClick={() => navigate('/admin')}>Dashboard</span>
        {' / '}
        <span className="cursor-pointer hover:underline" onClick={() => navigate('/admin/users')}>Users</span>
        {' / '}
        <span className="text-gray-700 dark:text-gray-200">Edit</span>
      </nav>
      <Card className="p-6 rounded-2xl shadow-md bg-white dark:bg-gray-800">
        <Heading size="xl" className="mb-4">Edit User</Heading>
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">First Name *</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter first name"
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                onBlur={() => handleBlur('first_name')}
                required
              />
              {errors.first_name && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.first_name}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Last Name *</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter last name"
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                onBlur={() => handleBlur('last_name')}
                required
              />
              {errors.last_name && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.last_name}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              value={form.email}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Phone</label>
            <input
              type="tel"
              className="w-full px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Roles</label>
            <div className="flex flex-wrap gap-3">
              {ROLE_OPTIONS.map(role => (
                <label key={role.value} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role.value)}
                    onChange={() => handleRolesChange(role.value)}
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>
            {errors.roles && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {errors.roles}
              </div>
            )}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Account Status</label>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onChange={v => setForm(f => ({ ...f, is_active: v }))}
                id="is_active"
              />
              <span className="text-sm">Account is active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Date Joined</label>
              <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {user.date_joined ? format(new Date(user.date_joined), 'dd MMM yyyy') : '—'}
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Last Login</label>
              <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {user.last_login ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true }) : '—'}
              </div>
            </div>
          </div>
          {/* Password reset and submit button will be added in next steps */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting && <span className="loader spinner-border animate-spin w-4 h-4 mr-2" aria-hidden="true" />}
              Update User
            </Button>
          </div>
          {/* Password Reset Section (admin only) */}
          {isAdmin && (
            <div className="pt-8">
              <button
                type="button"
                className="text-primary font-medium underline mb-2"
                onClick={() => setShowReset(v => !v)}
              >
                {showReset ? 'Hide Password Reset' : 'Reset Password'}
              </button>
              <AnimatePresence>
                {showReset && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <form className="space-y-4 mt-2" onSubmit={handlePasswordReset}>
                      <div>
                        <label className="block mb-1 text-sm font-medium">New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="w-full px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                            placeholder="Enter new password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); }}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            onClick={() => setShowPassword(v => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {/* Strength Meter */}
                        {password && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className={`h-2 w-24 rounded-full ${passwordStrength(password).color} transition-all`} />
                            <span className="text-xs text-gray-500">{passwordStrength(password).level}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">Confirm Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={e => { setConfirmPassword(e.target.value); }}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="pt-2">
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full flex items-center justify-center gap-2"
                          disabled={resetSubmitting}
                        >
                          {resetSubmitting && <span className="loader spinner-border animate-spin w-4 h-4 mr-2" aria-hidden="true" />}
                          Reset Password
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default EditUser; 