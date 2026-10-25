import React, { useState } from 'react';
import { LogIn, Sparkles, AlertCircle, Wrench, Shield, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function LoginPage({ onNavigate, onLoginSuccess }) {
  const { login, switchDemoAccount } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(loggedUser);
      } else if (loggedUser.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (loggedUser.role === 'WORKER') onNavigate('worker-dashboard');
      else onNavigate('customer-dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await switchDemoAccount(role);
      if (onLoginSuccess) {
        onLoginSuccess(loggedUser);
      } else if (loggedUser.role === 'ADMIN') onNavigate('admin-dashboard');
      else if (loggedUser.role === 'WORKER') onNavigate('worker-dashboard');
      else onNavigate('customer-dashboard');
    } catch (err) {
      setError('Failed to switch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-[#F8FAFC]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Form Card */}
        <div className="md:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-xl">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B2A] tracking-tight font-heading">
              Welcome back to <span className="text-[#116B63]">SAMARTH</span>
            </h2>
            <p className="text-sm text-[#64748B] mt-1.5">
              Sign in to manage your bookings, quotes, or services.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. customer_rohan or email"
                className="w-full px-4 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63] transition-all"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={LogIn}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-[#116B63] font-bold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>

        {/* Right Fast-Demo Quick Access Box */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#EAF5F1] to-white p-6 sm:p-8 rounded-3xl border border-[#116B63]/20 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-[#0B4945]">
            <Sparkles size={18} className="shrink-0 text-[#116B63]" />
            <h3 className="font-bold text-sm tracking-tight uppercase">
              1-Click Demo Accounts
            </h3>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Competition Evaluator Mode: Test any role instantly without typing passwords.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleQuickDemo('CUSTOMER')}
              className="w-full text-left p-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#116B63] hover:shadow-xs transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#116B63] shrink-0" />
                <span className="font-bold text-[#172B2A]">Customer (Rohan)</span>
              </div>
              <span className="text-[10px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">Login</span>
            </button>

            <button
              onClick={() => handleQuickDemo('ELECTRICIAN')}
              className="w-full text-left p-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#116B63] hover:shadow-xs transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-[#116B63] shrink-0" />
                <span className="font-bold text-[#172B2A]">Electrician (Ramesh)</span>
              </div>
              <span className="text-[10px] text-[#116B63] bg-[#EAF5F1] px-2 py-0.5 rounded font-semibold">Verified</span>
            </button>

            <button
              onClick={() => handleQuickDemo('PLUMBER')}
              className="w-full text-left p-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#116B63] hover:shadow-xs transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-[#116B63] shrink-0" />
                <span className="font-bold text-[#172B2A]">Plumber (Suresh)</span>
              </div>
              <span className="text-[10px] text-[#116B63] bg-[#EAF5F1] px-2 py-0.5 rounded font-semibold">Verified</span>
            </button>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <Shield size={15} className="text-rose-600 shrink-0" />
                  <span>Admin / Superuser</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                  Protected
                </span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Superuser access requires verified credentials. Automatic bypass is disabled.
              </p>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('');
                  setError('Please enter the administrator password.');
                  const pwdInput = document.querySelector('input[type="password"]');
                  if (pwdInput) pwdInput.focus();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
              >
                Pre-fill "admin" & enter password &rarr;
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
