import React from 'react';
import { SearchX } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = SearchX,
  title = "No results found",
  description = "We couldn't find anything matching your request at this time.",
  actionLabel = null,
  onAction = null,
  actionIcon = null,
  className = ""
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#EAF5F1] text-[#116B63] flex items-center justify-center mb-4 shrink-0 shadow-inner">
        <Icon size={28} className="shrink-0" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-bold text-[#172B2A] mb-1.5">
        {title}
      </h3>

      <p className="text-sm text-[#64748B] max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          icon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
