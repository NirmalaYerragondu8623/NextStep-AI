import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Toast from './components/Toast';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [screen, setScreen] = useState(token ? 'dashboard' : 'login');
  const [toasts, setToasts] = useState([]);

  // Sync screen state with token presence
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setScreen('dashboard');
    } else {
      localStorage.removeItem('token');
      if (screen === 'dashboard') {
        setScreen('login');
      }
    }
  }, [token]);

  // Handle Google OAuth Callback (extract token from URL hash on mount)
  useEffect(() => {
    const handleGoogleCallback = async (googleToken) => {
      try {
        const response = await fetch('http://localhost:8000/login/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: googleToken }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Google sign-in failed on server.');
        }
        
        // Log in with the JWT returned by our backend
        handleLoginSuccess(data.access_token);
        addToast('Successfully signed in with Google!', 'success');
      } catch (err) {
        addToast(err.message, 'error');
      }
    };

    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const googleToken = params.get('access_token');
      if (googleToken) {
        // Clear hash from URL cleanly
        window.history.replaceState(null, null, window.location.pathname);
        // Exchange Google token for Backend JWT
        handleGoogleCallback(googleToken);
      }
    }
  }, []);

  // Toast notifications helpers
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken('');
  };

  const handleRegisterSuccess = () => {
    setScreen('login');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] animate-float pointer-events-none"></div>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4">
        {screen === 'login' && (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            onNavigateToRegister={() => setScreen('register')} 
            addToast={addToast} 
          />
        )}
        {screen === 'register' && (
          <Register 
            onRegisterSuccess={handleRegisterSuccess} 
            onNavigateToLogin={() => setScreen('login')} 
            addToast={addToast} 
          />
        )}
        {screen === 'dashboard' && (
          <Dashboard 
            token={token} 
            onLogout={handleLogout} 
            addToast={addToast} 
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full text-center py-6 text-gray-500 text-xs border-t border-white/5 bg-darkBg/80 backdrop-blur-md relative z-10">
        <p>© 2026 NextStep AI. Built to accelerate career preparation. All rights reserved.</p>
      </footer>

      {/* Toast Notifications Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
