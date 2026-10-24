import React, { useState, useEffect } from 'react';
import { UserPlus, User, Wrench, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Button from '../components/common/Button';

export default function RegisterPage({ onNavigate, onRegistrationSuccess, initialRole = 'CUSTOMER' }) {
  const { register } = useAuth();
  const [role, setRole] = useState(initialRole);
  const [categories, setCategories] = useState([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('Koramangala, Bangalore');

  // Worker specific
  const [categoryId, setCategoryId] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [tradeTitle, setTradeTitle] = useState('');
  const [hourlyRate, setHourlyRate] = useState('350');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCats() {
      try {
        const cats = await api.categories.list();
        const categoryList = cats.results || cats || [];
        setCategories(categoryList);
        if (categoryList.length > 0) {
          setCategoryId(String(categoryList[0].id));
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchCats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      full_name: fullName,
      username,
      email,
      password,
      role,
      phone,
      locality,
    };

    if (role === 'WORKER') {
      payload.trade_title = tradeTitle || 'Certified Professional';
      payload.hourly_rate = hourlyRate;
      if (categoryId === '__add__') {
        payload.category_name = customCategoryName.trim();
      } else {
        payload.category_id = categoryId;
      }
    }

    try {
      const newUser = await register(payload);
      if (onRegistrationSuccess) {
        onRegistrationSuccess(newUser);
      } else if (newUser.role === 'WORKER') {
        onNavigate('worker-dashboard');
      } else {
        onNavigate('customer-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-[#F8FAFC]">
      <div className="max-w-2xl w-full bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-xl">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B2A] tracking-tight font-heading">
            Create your <span className="text-[#116B63]">SAMARTH</span> Account
          </h2>
          <p className="text-sm text-[#64748B] mt-1.5">
            Connect with skilled opportunities or discover trusted local professionals.
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-3 mb-8 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${role === 'CUSTOMER' ? 'bg-white text-[#116B63] shadow-sm' : 'text-[#64748B] hover:text-[#172B2A]'}`}
          >
            <User size={18} className="shrink-0" />
            <span>I Need Household Services</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('WORKER')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${role === 'WORKER' ? 'bg-white text-[#116B63] shadow-sm' : 'text-[#64748B] hover:text-[#172B2A]'}`}
          >
            <Wrench size={18} className="shrink-0" />
            <span>I am a Skilled Worker</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Anand Rao"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. anand_rao"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                Locality / Area
              </label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Koramangala 4th Block"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
              />
            </div>
          </div>

          {/* Additional Fields for Skilled Worker */}
          {role === 'WORKER' && (
            <div className="pt-4 border-t border-[#E2E8F0] space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#116B63]">
                Professional Trade Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                    Primary Trade
                  </label>
                  <select
                    value={categoryId}
                    required
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      if (e.target.value !== '__add__') {
                        setCustomCategoryName('');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                  >
                    <option value="">Select a trade</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="__add__">+ Add a job...</option>
                  </select>
                  {categoryId === '__add__' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="Enter a new trade"
                        aria-label="New primary trade"
                        className="min-w-0 flex-1 px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryId(categories.length ? String(categories[0].id) : '');
                          setCustomCategoryName('');
                        }}
                        aria-label="Cancel adding a trade"
                        className="p-2 text-slate-500 hover:text-[#172B2A]"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                    Trade Title
                  </label>
                  <input
                    type="text"
                    value={tradeTitle}
                    onChange={(e) => setTradeTitle(e.target.value)}
                    placeholder="e.g. Master Electrician"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B2A] uppercase tracking-wider mb-1">
                    Indicative Rate (₹/hr)
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="350"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116B63]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={UserPlus}
              className="w-full font-bold shadow-md shadow-[#116B63]/20"
            >
              Complete Registration
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-[#116B63] font-bold hover:underline"
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
}
