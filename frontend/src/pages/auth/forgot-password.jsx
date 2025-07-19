import React, { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import MawaddahInput from '../../components/atoms/mawaddah/MawaddahInput';
import { Heading, Text } from '../../components/atoms/typography';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-[400px] mx-auto px-6 py-8">
        <div className="bg-gray-100/40 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 px-6 py-8 space-y-8">
          <div className="text-center space-y-2">
            <Heading size="xl" as="h1" className="text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Forgot Password
            </Heading>
            <Text size="sm" muted className="text-center">
              Enter your email to receive a password reset link.
            </Text>
          </div>
          {submitted ? (
            <div className="text-green-700 dark:text-green-400 text-center">
              If an account exists for <b>{email}</b>, a password reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <MawaddahInput
                id="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={error}
                required
                autoComplete="username"
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-lg font-semibold shadow-md rounded-lg transition-colors duration-200 bg-[#1A7F55] hover:bg-[#176945] focus:ring-[#1A7F55]/50 border-none"
              >
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 