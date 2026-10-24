import React, { useState } from 'react';
import {
  Sparkles, User, Wrench, Shield, Compass, CheckCircle2,
  ArrowRight, X, ChevronRight, Layers, Star, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import Modal from './Modal';

export default function DemoTourBar({ onNavigate }) {
  const { user, switchDemoAccount, isCustomer, isWorker, isAdmin } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (role) => {
    setSwitching(true);
    try {
      const loggedUser = await switchDemoAccount(role);
      if (role === 'CUSTOMER') onNavigate('customer-dashboard');
      else if (role === 'ADMIN') onNavigate('admin-dashboard');
      else onNavigate('worker-dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  const steps = [
    {
      num: 1,
      role: 'Customer',
      title: 'Find Services & Match',
      desc: 'Browse categories or post a task. The Fair Matching Algorithm scores workers on Skill, Proximity, Availability, and Budget with explainable factor weights.',
    },
    {
      num: 2,
      role: 'Worker',
      title: 'Receive Request & Submit Quote',
      desc: 'Switch to Electrician (Ramesh). View incoming local requests, check customer budget, and submit an itemized quote (Labour + Parts + Total).',
    },
    {
      num: 3,
      role: 'Customer',
      title: 'Approve Quote & Confirm Booking',
      desc: 'Switch to Customer (Rohan). Review the itemized quote breakdown. 1-click approve confirms the booking and locks the agreed price.',
    },
    {
      num: 4,
      role: 'Worker',
      title: 'Execute & Complete Job',
      desc: 'Switch to Worker. Track booking lifecycle: click "Start Work" (In Progress), then "Mark Finished" (Completed). Real earnings update automatically.',
    },
    {
      num: 5,
      role: 'Customer',
      title: 'Feedback & 5-Star Review',
      desc: 'Switch to Customer. Leave an authentic rating (1-5 stars) and review, updating the worker\'s public trust score.',
    },
    {
      num: 6,
      role: 'Admin',
      title: 'Manual Verification Oversight',
      desc: 'Switch to Admin Officer. Review pending worker documents (Aadhaar/Trade license) and grant or reject Verified Pro badges.',
    },
  ];

  return (
    <>
      {/* Persistent Top MVP Tour Bar */}
      <div className="bg-[#0B4945] text-white text-xs px-3 sm:px-6 py-2 border-b border-teal-800/80 shadow-inner flex flex-wrap items-center justify-between gap-2.5 z-50">
        
        {/* Left: MVP Mode Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
            <Sparkles size={12} className="text-emerald-300 animate-pulse" />
            <span>MVP Evaluator Mode</span>
          </span>

          <span className="text-teal-200 hidden md:inline">
            Active Role: <strong className="text-white">{user?.full_name || 'Visitor'}</strong> ({user?.role || 'Guest'})
          </span>
        </div>

        {/* Center: 1-Click Fast Role Switch Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            disabled={switching}
            onClick={() => handleRoleSwitch('CUSTOMER')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${isCustomer && user?.username === 'customer_rohan' ? 'bg-[#116B63] text-white ring-1 ring-emerald-300 shadow-xs' : 'bg-teal-900/60 hover:bg-teal-800 text-teal-100'}`}
          >
            <User size={12} />
            <span>Customer (Rohan)</span>
          </button>

          <button
            disabled={switching}
            onClick={() => handleRoleSwitch('ELECTRICIAN')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${isWorker && user?.username === 'worker_ramesh' ? 'bg-[#116B63] text-white ring-1 ring-emerald-300 shadow-xs' : 'bg-teal-900/60 hover:bg-teal-800 text-teal-100'}`}
          >
            <Wrench size={12} />
            <span>Electrician (Ramesh)</span>
          </button>

          <button
            disabled={switching}
            onClick={() => handleRoleSwitch('PLUMBER')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${isWorker && user?.username === 'worker_suresh' ? 'bg-[#116B63] text-white ring-1 ring-emerald-300 shadow-xs' : 'bg-teal-900/60 hover:bg-teal-800 text-teal-100'}`}
          >
            <Wrench size={12} />
            <span>Plumber (Suresh)</span>
          </button>

          <button
            disabled={switching}
            onClick={() => handleRoleSwitch('ADMIN')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${isAdmin ? 'bg-rose-700 text-white ring-1 ring-rose-300 shadow-xs' : 'bg-teal-900/60 hover:bg-teal-800 text-rose-200'}`}
          >
            <Shield size={12} />
            <span>Admin</span>
          </button>
        </div>

        {/* Right: Interactive 5-Step Tour Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTourOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-[11px] shadow-sm transition-colors"
          >
            <Compass size={13} className="shrink-0" />
            <span>Interactive MVP Guide</span>
          </button>
        </div>

      </div>

      {/* MVP TOUR MODAL */}
      <Modal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        title="SAMARTH — Competition MVP Walkthrough"
        subtitle="Follow this 6-step journey to evaluate the entire end-to-end full-stack workflow."
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#64748B]">All workflows backed by live SQLite database & DRF APIs</span>
            <Button variant="primary" size="sm" onClick={() => setTourOpen(false)}>
              Got it, let's test!
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          {steps.map((st) => (
            <div
              key={st.num}
              className="p-3.5 rounded-2xl bg-slate-50 border border-[#E2E8F0] hover:border-[#116B63]/40 transition-all flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-xl bg-[#EAF5F1] text-[#0B4945] font-black text-xs flex items-center justify-center shrink-0">
                0{st.num}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#172B2A]">{st.title}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Role: {st.role}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
