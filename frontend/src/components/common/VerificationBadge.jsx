import React from 'react';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export default function VerificationBadge({ status, showLabel = true, className = '' }) {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'VERIFIED') {
    return (
      <span
        title="Admin-Verified Identity & Skills"
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-[#EAF5F1] text-[#0B4945] border border-[#16845B]/30 ${className}`}
      >
        <ShieldCheck size={14} className="shrink-0 text-[#16845B]" aria-hidden="true" />
        {showLabel && <span className="leading-none whitespace-nowrap">Verified Pro</span>}
      </span>
    );
  }

  if (normalized === 'PENDING') {
    return (
      <span
        title="Verification documents under administrative review"
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
      >
        <Clock size={14} className="shrink-0 text-amber-600" aria-hidden="true" />
        {showLabel && <span className="leading-none whitespace-nowrap">Verification Pending</span>}
      </span>
    );
  }

  return (
    <span
      title="Unverified profile"
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      <AlertTriangle size={14} className="shrink-0 text-slate-500" aria-hidden="true" />
      {showLabel && <span className="leading-none whitespace-nowrap">Unverified</span>}
    </span>
  );
}
