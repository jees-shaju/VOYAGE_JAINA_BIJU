import React, { useState } from 'react';
import {
  Wrench, ShieldCheck, User as UserIcon, LogOut, Menu, X,
  PlusCircle, Briefcase, FileText, CheckCircle2, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import IconButton from './IconButton';

export default function Navbar({ onNavigate, currentPage }) {
  const { user, isAuthenticated, logout, isCustomer, isWorker, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNav(isAuthenticated ? (isAdmin ? 'admin-dashboard' : isWorker ? 'worker-dashboard' : 'customer-dashboard') : 'landing')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B4945] to-[#116B63] text-white flex items-center justify-center shadow-md shadow-[#116B63]/20 group-hover:scale-105 transition-transform shrink-0">
                <Wrench size={20} className="shrink-0" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-[#172B2A] block leading-none font-heading">
                  SAM<span className="text-[#116B63]">ARTH</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] block mt-1">
                  Skills &bull; Opportunities
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNav('landing')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'landing' ? 'text-[#116B63] bg-[#EAF5F1]' : 'text-[#64748B] hover:text-[#172B2A]'}`}
                  >
                    Home
                  </button>
                  <a
                    href="#services"
                    onClick={() => handleNav('landing')}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#172B2A] transition-colors"
                  >
                    Services
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={() => handleNav('landing')}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#172B2A] transition-colors"
                  >
                    How it Works
                  </a>
                  <a
                    href="#for-workers"
                    onClick={() => handleNav('landing')}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#172B2A] transition-colors"
                  >
                    For Workers
                  </a>
                </>
              ) : isCustomer ? (
                <>
                  <button
                    onClick={() => handleNav('customer-dashboard')}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'customer-dashboard' ? 'text-[#116B63] bg-[#EAF5F1]' : 'text-[#64748B] hover:text-[#172B2A]'}`}
                  >
                    <Briefcase size={16} className="shrink-0" aria-hidden="true" />
                    <span>My Dashboard</span>
                  </button>
                  <button
                    onClick={() => handleNav('create-request')}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'create-request' ? 'text-[#116B63] bg-[#EAF5F1]' : 'text-[#64748B] hover:text-[#172B2A]'}`}
                  >
                    <PlusCircle size={16} className="shrink-0" aria-hidden="true" />
                    <span>Post Service Request</span>
                  </button>
                </>
              ) : isWorker ? (
                <>
                  <button
                    onClick={() => handleNav('worker-dashboard')}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'worker-dashboard' ? 'text-[#116B63] bg-[#EAF5F1]' : 'text-[#64748B] hover:text-[#172B2A]'}`}
                  >
                    <Briefcase size={16} className="shrink-0" aria-hidden="true" />
                    <span>Worker Dashboard</span>
                  </button>
                </>
              ) : isAdmin ? (
                <>
                  <button
                    onClick={() => handleNav('admin-dashboard')}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'admin-dashboard' ? 'text-[#116B63] bg-[#EAF5F1]' : 'text-[#64748B] hover:text-[#172B2A]'}`}
                  >
                    <Shield size={16} className="shrink-0" aria-hidden="true" />
                    <span>Admin Control Center</span>
                  </button>
                </>
              ) : null}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-[#E2E8F0]">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#172B2A] leading-tight">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-[11px] font-semibold text-[#116B63]">
                    {user?.role === 'CUSTOMER' ? 'Customer' : user?.role === 'WORKER' ? 'Skilled Worker' : 'Platform Admin'}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#EAF5F1] text-[#116B63] flex items-center justify-center font-bold text-xs border border-[#16845B]/20 shrink-0">
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={LogOut}
                  onClick={logout}
                  className="text-[#64748B] hover:text-[#C24141]"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => handleNav('login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={PlusCircle}
                  onClick={() => handleNav('register')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <IconButton
              icon={mobileMenuOpen ? X : Menu}
              label="Toggle navigation menu"
              size="md"
              variant="outline"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {isAuthenticated ? (
            <div className="p-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#172B2A]">{user?.full_name}</div>
                <div className="text-xs text-[#116B63] font-semibold">{user?.role}</div>
              </div>
              <Button variant="outline" size="sm" icon={LogOut} onClick={logout}>
                Logout
              </Button>
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNav('landing')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#172B2A] hover:bg-slate-50"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNav('login')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#172B2A] hover:bg-slate-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#116B63] text-white"
                >
                  Get Started
                </button>
              </>
            ) : isCustomer ? (
              <>
                <button
                  onClick={() => handleNav('customer-dashboard')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#172B2A] hover:bg-[#EAF5F1]"
                >
                  <Briefcase size={18} className="shrink-0 text-[#116B63]" />
                  <span>Customer Dashboard</span>
                </button>
                <button
                  onClick={() => handleNav('create-request')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#172B2A] hover:bg-[#EAF5F1]"
                >
                  <PlusCircle size={18} className="shrink-0 text-[#116B63]" />
                  <span>Post Service Request</span>
                </button>
              </>
            ) : isWorker ? (
              <button
                onClick={() => handleNav('worker-dashboard')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#172B2A] hover:bg-[#EAF5F1]"
              >
                <Briefcase size={18} className="shrink-0 text-[#116B63]" />
                <span>Worker Dashboard</span>
              </button>
            ) : isAdmin ? (
              <button
                onClick={() => handleNav('admin-dashboard')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#172B2A] hover:bg-[#EAF5F1]"
              >
                <Shield size={18} className="shrink-0 text-[#116B63]" />
                <span>Admin Control Center</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
