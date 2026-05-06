import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/common';
import { HiUser, HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';
import brandingImage from './RA_branding.png';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, name, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    if (provider === 'Google') {
      window.location.href = 'http://localhost:5000/auth/oauth/google';
    } else {
      alert(`${provider} OAuth is not yet implemented`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-bg flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 -right-32 w-72 h-72 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute -bottom-20 -left-32 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      {/* Container */}
      <div className="relative w-full max-w-6xl mx-auto flex items-center justify-between h-screen px-8">
        {/* Left Side - Visual */}
        <div className="hidden lg:flex w-1/2 items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Logo Showcase */}
            <div className="relative">
              <img src={brandingImage} alt="RA Branding" className="w-40 h-40 rounded-3xl shadow-2xl" />
              
              {/* Decorative rings */}
              <div className="absolute -inset-4 border-2 border-accent-500/30 rounded-3xl animate-pulse"></div>
              <div className="absolute -inset-8 border border-primary-500/20 rounded-3xl"></div>
            </div>

            {/* Floating Text */}
            <div className="absolute bottom-20 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Join TaskFlow</h2>
              <p className="text-dark-textSecondary text-lg">Start managing tasks with your team</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Form Container */}
            <div className="bg-dark-card/60 backdrop-blur-xl rounded-2xl border border-dark-border p-8 shadow-2xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark-text mb-2">Create Account</h1>
                <p className="text-dark-textSecondary">Get started with TaskFlow</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Full Name</label>
                  <div className="relative">
                    <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textSecondary pointer-events-none" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text placeholder-dark-textSecondary focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Email Address</label>
                  <div className="relative">
                    <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textSecondary pointer-events-none" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text placeholder-dark-textSecondary focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Password</label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textSecondary pointer-events-none" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text placeholder-dark-textSecondary focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                  <p className="mt-2 text-xs text-dark-textSecondary">At least 6 characters</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-8"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <HiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-dark-border"></div>
                <span className="px-3 text-sm text-dark-textSecondary">or continue with</span>
                <div className="flex-1 border-t border-dark-border"></div>
              </div>

              {/* OAuth Button */}
              <button
                type="button"
                onClick={() => handleOAuthLogin('Google')}
                className="w-full py-3 bg-dark-bg border border-dark-border text-dark-text font-medium rounded-xl hover:border-primary-500/50 hover:bg-dark-bg/80 transition-all flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Sign In Link */}
              <p className="mt-6 text-center text-dark-textSecondary">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;