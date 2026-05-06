import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiMail, HiLockClosed, HiArrowRight, HiUser, HiEye, HiEyeOff } from 'react-icons/hi';
import backgroundImage from './taskflowbg.avif';
import brandingImage from './RA_branding.png';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Invalid email or password';
      setLoginError(errorMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);
    try {
      await register(registerEmail, registerName, registerPassword);
      navigate('/dashboard');
    } catch (err) {
      setRegisterError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = 'http://localhost:5000/auth/oauth/google';
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image with reduced opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Dark overlay gradient for seamless blend */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1d]/80 via-[#1a1a1d]/95 to-[#0d0d0f]"></div>

      {/* Bottom Right Branding */}
      <div className="absolute bottom-8 right-8 z-10">
        <img src={brandingImage} alt="RA Branding" className="w-16 h-16 rounded-2xl border border-[#2D7FFD]/20" />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center px-8 py-20">
        <div className="w-full max-w-6xl flex items-center gap-16">
          
          {/* Left Hero Section */}
          <div className="hidden lg:flex flex-1 flex-col items-start justify-center max-w-md">
            <div className="relative z-10">
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-[#2D7FFD] to-[#D81BFA] bg-clip-text text-transparent drop-shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                {activeTab === 'login' ? 'WELCOME TO TASKFLOW' : 'JOIN WITH TASKFLOW'}
              </h2>
              <p className="text-base text-gray-400 font-normal leading-relaxed drop-shadow-md mt-6">
                {activeTab === 'login' ? (
                  <>Sign in to sync your progress and keep your team's momentum moving forward.</>
                ) : (
                  <>Create an account to adopt a smarter way to manage your time and collaborate effortlessly.</>
                )}
              </p>
            </div>
          </div>

          {/* Right Task Portal Card */}
          <div className="flex-1 max-w-md w-full">
            <div className="bg-[#1f1f23]/80 backdrop-blur-2xl rounded-3xl border border-[#3A3A3E]/50 p-8 shadow-2xl">
              
              {/* Tab Bar */}
              <div className="flex relative mb-8">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3 text-lg font-medium transition-colors relative ${
                    activeTab === 'login' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Login
                  {activeTab === 'login' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2D7FFD] to-[#D81BFA]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-3 text-lg font-medium transition-colors relative ${
                    activeTab === 'signup' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Sign Up
                  {activeTab === 'signup' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2D7FFD] to-[#D81BFA]"></div>
                  )}
                </button>
              </div>

              {/* Conditional Form Section */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Form Title */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-white mb-1">Welcome Back</h1>
                    <p className="text-gray-400 font-medium">Login to your TaskFlow account</p>
                  </div>

                  {/* Error Message */}
                  {loginError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                      <p className="text-sm text-red-300">{loginError}</p>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="admin@greencoders.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#2A2A2D] border border-[#3A3A3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2D7FFD] focus:ring-1 focus:ring-[#2D7FFD]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">Password</label>
                      <a href="#" className="text-sm text-[#2D7FFD] hover:text-[#357BF1] transition-colors">Forgot Password?</a>
                    </div>
                    <div className="relative">
                      <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="********"
                        required
                        className="w-full pl-10 pr-12 py-3 bg-[#2A2A2D] border border-[#3A3A3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2D7FFD] focus:ring-1 focus:ring-[#2D7FFD]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-[#2D7FFD] text-white font-semibold rounded-xl hover:bg-[#357BF1] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-6"
                  >
                    {loginLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <HiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  {/* Form Title */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-white mb-1">Create Account</h1>
                    <p className="text-gray-400 font-medium">Get started with TaskFlow</p>
                  </div>

                  {/* Error Message */}
                  {registerError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                      <p className="text-sm text-red-300">{registerError}</p>
                    </div>
                  )}

                  {/* Full Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <div className="relative">
                      <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                      <input
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#2A2A2D] border border-[#3A3A3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2D7FFD] focus:ring-1 focus:ring-[#2D7FFD]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="admin@greencoders.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#2A2A2D] border border-[#3A3A3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2D7FFD] focus:ring-1 focus:ring-[#2D7FFD]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="********"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-12 py-3 bg-[#2A2A2D] border border-[#3A3A3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2D7FFD] focus:ring-1 focus:ring-[#2D7FFD]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">At least 6 characters</p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full py-3 bg-[#2D7FFD] text-white font-semibold rounded-xl hover:bg-[#357BF1] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-6"
                  >
                    {registerLoading ? (
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
              )}

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-[#3A3A3E]"></div>
                <span className="px-3 text-sm text-gray-500">or continue with</span>
                <div className="flex-1 border-t border-[#3A3A3E]"></div>
              </div>

              {/* OAuth Button */}
              <button
                type="button"
                onClick={handleOAuthLogin}
                className="w-full py-3 bg-[#2A2A2D] border border-[#3A3A3E] text-white font-medium rounded-xl hover:border-[#2D7FFD]/50 hover:bg-[#2A2A2D]/80 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Bottom Cross-Links */}
              <p className="mt-6 text-center text-gray-400">
                {activeTab === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button onClick={() => setActiveTab('signup')} className="text-[#2D7FFD] hover:text-[#357BF1] font-semibold transition-colors">
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => setActiveTab('login')} className="text-[#2D7FFD] hover:text-[#357BF1] font-semibold transition-colors">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;