import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const publicKey = searchParams.get('publicKey');
        const secretKey = searchParams.get('secretKey');

        if (!token || !refreshToken) {
          setError('Authentication failed: Missing tokens');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Store tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        // Store secret key for E2EE if available
        if (secretKey) {
          localStorage.setItem('secretKey', secretKey);
        }

        // Store user data
        const user = {
          id: parseInt(userId),
          email,
          name,
          public_key: publicKey
        };
        setUser(user);

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to process authentication: ' + err.message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-dark-100 p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-dark-600 mb-4">{error}</p>
          <p className="text-sm text-dark-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-dark-100 p-8 max-w-md">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-dark-900">Completing Sign In</h1>
          <p className="text-dark-600">Please wait while we complete your authentication...</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
