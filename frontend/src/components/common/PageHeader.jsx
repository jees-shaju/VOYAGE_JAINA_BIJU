import React from 'react';
import { ArrowLeft } from 'lucide-react';
import IconButton from './IconButton';

export default function PageHeader({
  title,
  subtitle,
  onBack = null,
  actions = null,
  badge = null
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2E8F0] mb-8">
      <div className="flex items-start gap-3.5">
        {onBack && (
          <IconButton
            icon={ArrowLeft}
            label="Go back"
            variant="outline"
            size="md"
            onClick={onBack}
            className="mt-0.5"
          />
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B2A] tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm sm:text-base text-[#64748B] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
