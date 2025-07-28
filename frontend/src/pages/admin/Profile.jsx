import React, { useState, useEffect, useMemo } from 'react';
import MawaddahAvatar from '../../components/atoms/mawaddah/MawaddahAvatar';
import { MawaddahInput, MawaddahSelect, MawaddahButton } from '../../components/atoms/mawaddah';
import Modal from '../../components/molecules/Modal';
import useAuth from '../../context/useAuth';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

import { User as UserIcon, Mail, Shield, Clock, Phone, ArrowLeft } from 'lucide-react';

// Language options
const LANGUAGE_OPTIONS = [
  { label: 'English (EN)', value: 'en' },
  { label: 'اردو (UR)', value: 'ur' },
];

const initialState = {
  avatar: null,
  full_name: '',
  phone_number: '',
  language: '',
  email: '',
  last_login: '',
  role: '',
};

// Utility to get CSRF token from cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function Profile() {
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Change password state
  const [passwordFields, setPasswordFields] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --------------------
  // Validation Functions
  // --------------------
  const getValidationErrors = (form, avatarFile) => {
    const newErrors = {};
    if (!form.full_name || form.full_name.trim().length === 0) {
      newErrors.full_name = 'Name is required.';
    } else if (form.full_name.length > 50) {
      newErrors.full_name = 'Name must be 50 characters or less.';
    }
    if (!form.phone_number || form.phone_number.trim().length === 0) {
      newErrors.phone_number = 'Phone number is required.';
    } else if (!/^\+?\d{7,15}$/.test(form.phone_number)) {
      newErrors.phone_number = 'Enter a valid phone number.';
    }
    if (!form.language || !['en', 'ur'].includes(form.language)) {
      newErrors.language = 'Language is required.';
    }
    if (avatarFile) {
      if (!avatarFile.type.startsWith('image/')) {
        newErrors.avatar = 'Avatar must be an image file.';
      } else if (avatarFile.size > 2 * 1024 * 1024) {
        newErrors.avatar = 'Avatar must be 2MB or less.';
      }
    }
    return newErrors;
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordFields.current_password) errs.current_password = 'Current password is required.';
    if (!passwordFields.new_password) errs.new_password = 'New password is required.';
    else if (passwordFields.new_password.length < 8) errs.new_password = 'Password must be at least 8 characters.';
    if (passwordFields.confirm_password !== passwordFields.new_password)
      errs.confirm_password = 'Passwords do not match.';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --------------------
  // Data Fetch (Profile)
  // --------------------
  useEffect(() => {
    if (!token) return;
    setLoading(true);

    api
      .get('/api/admin/profile/')
      .then((res) => {
        const json = res.data;
        if (json.success && json.data) {
          setForm({
            ...form,
            ...json.data,
            avatar: json.data.avatar || null,
          });
        } else {
          setApiError(json.message || 'Failed to load profile');
        }
        setLoading(false);
      })
      .catch((err) => {
        setApiError(err.response?.data?.message || err.message);
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [token]);

  // --------------------
  // Handlers
  // --------------------
  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAvatarChange = (file) => {
    setAvatarFile(file);
    setForm((prev) => ({ ...prev, avatar: file }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  const handleAvatarClear = () => {
    setAvatarFile(null);
    setForm((prev) => ({ ...prev, avatar: null }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newErrors = getValidationErrors(form, avatarFile);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setIsSaving(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append('full_name', form.full_name);
      formData.append('phone_number', form.phone_number);
      formData.append('language', form.language);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (form.avatar === null) {
        formData.append('avatar', ''); // clear avatar
      }

      const res = await api.patch('/api/admin/profile/', formData, {
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });
      const json = res.data;

      if (!json.success) {
        if (json.errors) setErrors(json.errors);
        setApiError(json.message || 'Failed to update profile');
        toast.error(json.message || 'Failed to update profile');
      } else {
        setForm((prev) => ({ ...prev, ...json.data }));
        setAvatarFile(null);
        setIsDirty(false);
        setSuccess(true);
        toast.success('Profile updated successfully!');
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.message);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setIsChangingPassword(true);

    try {
      const res = await api.post('/api/auth/change-password/', passwordFields, {
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      const json = res.data;

      if (!json.success) {
        setPasswordErrors(json.errors || {});
        toast.error(json.message || 'Failed to change password');
      } else {
        setPasswordSuccess(true);
        toast.success('Password changed successfully!');
        setTimeout(() => {
          setPasswordSuccess(false);
          setShowPasswordModal(false);
          setPasswordFields({ current_password: '', new_password: '', confirm_password: '' });
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('/api/logout/');
      localStorage.clear();
      toast.success('Logged out successfully.');
      navigate('/auth/login');
    } catch (err) {
      localStorage.clear();
      toast.success('Logged out.');
      navigate('/auth/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // --------------------
  // Derived Values
  // --------------------
  const avatarPreview = avatarFile || form.avatar;
  const validationErrors = useMemo(() => getValidationErrors(form, avatarFile), [form, avatarFile]);
  const formattedLastLogin = form.last_login
    ? new Date(form.last_login).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).replace(',', ' •')
    : '';

  // --------------------
  // Render
  // --------------------
  if (loading) {
    return <div className="max-w-2xl mx-auto py-8 text-center text-lg">Loading profile...</div>;
  }
  if (apiError) {
    return <div className="max-w-2xl mx-auto py-8 text-center text-red-600">{apiError}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-center text-lg">
      {/* Back Button */}
      <div className="flex items-center mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-600 hover:underline focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold ml-4">Profile</h1>
      </div>
      <hr className="my-6 border-gray-200" />

      {/* Form */}
      <div className="max-w-2xl mx-auto w-full bg-muted rounded-xl shadow-sm border p-6 mt-8">
        <div className="grid grid-cols-[auto,1fr] items-start">
          {/* Avatar */}
          <div className="flex items-center justify-center border rounded-xl bg-muted/40 p-4 w-fit h-fit mr-8">
            <MawaddahAvatar
              value={avatarPreview}
              onChange={handleAvatarChange}
              onClear={handleAvatarClear}
              disabled={isSaving}
            />
          </div>

          {/* Profile Form */}
          <form className="w-full space-y-4" onSubmit={handleSave}>
            <MawaddahInput
              label="Full Name"
              name="fullName"
              value={form.full_name}
              onChange={(e) => handleFieldChange('full_name', e.target.value)}
              leftIcon={<UserIcon />}
              error={errors.full_name}
              disabled={isSaving}
              autoComplete="name"
              placeholder="Enter your full name"
            />
            {/* Email & Role */}
            <div className="flex gap-4">
              <div className="flex-1">
                <MawaddahInput
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  leftIcon={<Mail />}
                  error={errors.email}
                  disabled={isSaving}
                  autoComplete="email"
                />
              </div>
              <div className="flex-1">
                <MawaddahInput label="Role" name="role" value={form.role} leftIcon={<Shield />} disabled />
              </div>
            </div>
            {/* Phone & Last Login */}
            <div className="flex gap-4">
              <div className="flex-1">
                <MawaddahInput
                  label="Phone Number"
                  name="phone"
                  value={form.phone_number}
                  onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                  leftIcon={<Phone />}
                  error={errors.phone_number}
                  disabled={isSaving}
                  autoComplete="tel"
                />
              </div>
              <div className="flex-1">
                <MawaddahInput
                  label="Last Login"
                  name="lastLogin"
                  value={formattedLastLogin}
                  leftIcon={<Clock />}
                  disabled
                />
              </div>
            </div>
            {/* Language */}
            <MawaddahSelect
              label="Language"
              options={LANGUAGE_OPTIONS}
              value={form.language}
              onChange={(val) => handleFieldChange('language', val)}
              error={errors.language}
              disabled={isSaving}
            />
            {/* Buttons */}
            <div className="flex gap-4 justify-end mt-6">
              <MawaddahButton
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
                disabled={isSaving}
              >
                Change Password
              </MawaddahButton>
              <MawaddahButton type="submit" loading={isSaving} disabled={isSaving}>
                Save Changes
              </MawaddahButton>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <MawaddahInput
            label="Current Password"
            type="password"
            value={passwordFields.current_password}
            onChange={(e) => setPasswordFields((f) => ({ ...f, current_password: e.target.value }))}
            error={passwordErrors.current_password}
            disabled={isChangingPassword}
          />
          <MawaddahInput
            label="New Password"
            type="password"
            value={passwordFields.new_password}
            onChange={(e) => setPasswordFields((f) => ({ ...f, new_password: e.target.value }))}
            error={passwordErrors.new_password}
            disabled={isChangingPassword}
          />
          <MawaddahInput
            label="Confirm New Password"
            type="password"
            value={passwordFields.confirm_password}
            onChange={(e) => setPasswordFields((f) => ({ ...f, confirm_password: e.target.value }))}
            error={passwordErrors.confirm_password}
            disabled={isChangingPassword}
          />
          <div className="flex justify-end gap-2 mt-4">
            <MawaddahButton
              variant="outline"
              type="button"
              onClick={() => setShowPasswordModal(false)}
              disabled={isChangingPassword}
            >
              Cancel
            </MawaddahButton>
            <MawaddahButton type="submit" disabled={isChangingPassword || passwordSuccess}>
              {isChangingPassword ? 'Changing...' : passwordSuccess ? 'Changed' : 'Change Password'}
            </MawaddahButton>
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Confirm Logout">
        <div className="space-y-4">
          <p>Are you sure you want to logout?</p>
          <div className="flex justify-end gap-2 mt-4">
            <MawaddahButton
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </MawaddahButton>
            <MawaddahButton variant="default" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </MawaddahButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
