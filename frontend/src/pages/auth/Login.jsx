import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/atoms/Button';
import MawaddahInput from '../../components/atoms/mawaddah/MawaddahInput';
import { Heading, Text } from '../../components/atoms/typography';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../context/useAuth'; // Import the unified auth hook

const Login = () => {
  const { theme, isDark } = useTheme();
  const { login } = useAuth(); // Use the login function from the hook
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required.';
    if (!formData.password) newErrors.password = 'Password is required.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsLoading(true);
    setFormError('');

    // Call the login function from our unified useAuth hook
    const result = await login(formData.email, formData.password, formData.rememberMe);

    if (!result.success) {
      setFormError(result.error);
      setErrors({ email: true, password: true });
    } else {
      navigate('/admin', { replace: true });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Maroon Radial Blur Accent */}
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-maroon/20 blur-3xl rounded-full z-0 animate-fade-in" />

      {/* Islamic Geometric Pattern Background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-maroon rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Decorative Islamic Pattern */}
      <div className="absolute top-8 right-8 opacity-20 dark:opacity-30 animate-islamic-rotate z-0">
        <svg width="120" height="120" viewBox="0 0 120 120" className="text-primary">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 0L24 16L40 20L24 24L20 40L16 24L0 20L16 16Z" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="120" height="120" fill="url(#islamic-pattern)"/>
        </svg>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[400px] mx-auto px-6 py-8">
        <div className="bg-gray-100/40 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 px-6 py-8 space-y-8">
          {/* Logo and Brand */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative animate-float transition-all duration-500 hover:scale-105 shadow-[0_0_12px_rgba(26,127,85,0.6)]">
                <img
                  src="/ic_mawaddah_180x180.png"
                  alt="Mawaddah Logo"
                  className="h-16 w-16 rounded-xl object-contain mx-auto select-none"
                  draggable="false"
                />
                {/* Decorative ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-2xl opacity-20 blur-sm pointer-events-none"></div>
              </div>
            </div>
            <div className="space-y-2">
              <Heading size="2xl" as="h1" className="text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Mawaddah
              </Heading>
              <Text size="sm" muted className="text-center">
                Admin Dashboard
              </Text>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-2">
            <Heading size="lg" as="h2" className="text-gray-900 dark:text-gray-100">
              Welcome Back
            </Heading>
            <Text muted className="text-sm">
              Sign in to your account to continue
            </Text>
          </div>

          {/* Login Form */}
          {formError && (
            <div className="text-center text-red-500 text-sm mb-2">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <MawaddahInput
                id="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                required
                autoComplete="username"
              />
              <MawaddahInput
                id="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                required
                autoComplete="current-password"
              />
            </div>
            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <Text size="sm" className="text-gray-700 dark:text-gray-300">
                  Remember me
                </Text>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>
            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-lg font-semibold shadow-md rounded-lg transition-colors duration-200 bg-[#1A7F55] hover:bg-[#176945] focus:ring-[#1A7F55]/50 border-none"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          {/* Arabic Verse */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p lang="ar" dir="rtl" className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ
            </p>
            <Text size="xs" muted className="text-center">
              "Indeed, the believers are brothers"
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 