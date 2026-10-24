import React from 'react';
import {
  Clock, CheckCircle2, AlertCircle, XCircle,
  FileCheck, PlayCircle, Ban
} from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  const normalized = (status || '').toUpperCase();

  const configs = {
    OPEN: {
      label: 'Open for Quotes',
      icon: Clock,
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    QUOTED: {
      label: 'Quote Received',
      icon: FileCheck,
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    BOOKED: {
      label: 'Booked',
      icon: CheckCircle2,
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    CONFIRMED: {
      label: 'Confirmed',
      icon: CheckCircle2,
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: PlayCircle,
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    COMPLETED: {
      label: 'Completed',
      icon: CheckCircle2,
      bg: 'bg-[#EAF5F1] text-[#0B4945] border-[#16845B]/30',
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: Ban,
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    SUBMITTED: {
      label: 'Submitted',
      icon: Clock,
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    ACCEPTED: {
      label: 'Accepted',
      icon: CheckCircle2,
      bg: 'bg-[#EAF5F1] text-[#0B4945] border-[#16845B]/30',
    },
    REJECTED: {
      label: 'Declined',
      icon: XCircle,
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };

  const config = configs[normalized] || {
    label: status,
    icon: AlertCircle,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bg} ${className}`}
    >
      <Icon size={14} className="shrink-0" aria-hidden="true" />
      <span className="leading-none whitespace-nowrap">{config.label}</span>
    </span>
  );
}
