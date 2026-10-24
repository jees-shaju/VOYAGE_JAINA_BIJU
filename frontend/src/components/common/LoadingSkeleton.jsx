import React from 'react';

export default function LoadingSkeleton({ count = 3, type = 'card' }) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded-md w-full" />
              <div className="h-3 bg-slate-100 rounded-md w-4/5" />
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div className="h-5 bg-slate-200 rounded-md w-24" />
              <div className="h-8 bg-slate-200 rounded-lg w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-4.5 animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-3 bg-slate-100 rounded-md w-1/4" />
            </div>
          </div>
          <div className="h-8 bg-slate-200 rounded-lg w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}
