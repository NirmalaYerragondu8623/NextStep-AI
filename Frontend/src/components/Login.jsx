import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle } from 'lucide-react';

export default function Login({ onLoginSuccess, onNavigateToRegister, addToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Invalid email address format';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Invalid password or email');
      }

      addToast('Login successful! Redirecting...', 'success');
      onLoginSuccess(data.access_token);
    } catch (err) {
      setSubmitError(err.message === 'Failed to fetch' ? 'Server connection error.' : err.message);
      addToast(err.message === 'Failed to fetch' ? 'Server connection error.' : err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = "898646512594-5bhsj3v9bafs1ive9iqdbsprvafrlba9.apps.googleusercontent.com";

    addToast('Redirecting to Google Sign-In...', 'info');

    setTimeout(() => {
      if (clientId.includes("placeholder")) {
        // Simulation mode: automatically navigate back with mock credentials
        window.location.hash = `#access_token=mock_google_session_token_xyz`;
      } else {
        const redirectUri = window.location.origin;
        const scope = "openid email profile";
        const responseType = "token";
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}`;
        window.location.href = authUrl;
      }
    }, 1000);
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl glass-panel glow-cyan transition-all duration-300">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 mb-3 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5">
          <div className="w-full h-full bg-darkBg rounded-[14px] flex items-center justify-center overflow-hidden">
            <img src="/src/assets/logo.png" alt="NextStep AI Logo" className="w-12 h-12 object-contain error-fallback-logo" onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<span class="text-xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">NS</span>';
            }} />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Welcome Back</h2>
        <p className="text-gray-400 text-sm mt-1">Accelerate your preparation journey</p>
      </div>

      {/* Login Error Message Box positioned at the top of the fields */}
      {submitError && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-3 rounded-xl glass-input ${errors.email ? 'border-red-500/50 focus:border-red-500' : ''}`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="text-xs text-rose-400 mt-1.5 font-medium">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-10 pr-10 py-3 rounded-xl glass-input ${errors.password ? 'border-red-500/50 focus:border-red-500' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-400 mt-1.5 font-medium text-wrap">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Continue with Google Option */}
      <div className="mt-5">
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs font-semibold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 mt-3 bg-white/5 hover:bg-white/10 text-gray-200 font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="text-center mt-6">
        <p className="text-gray-400 text-sm">
          Don't have an account?{' '}
          <button
            onClick={onNavigateToRegister}
            disabled={isLoading}
            className="text-cyan-400 hover:text-cyan-300 font-semibold focus:outline-none"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
