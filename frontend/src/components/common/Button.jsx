import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-55 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-sm px-4 py-2 gap-2 h-10",
    lg: "text-base px-5 py-2.5 gap-2.5 h-12",
  };

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 20,
  };

  const variantStyles = {
    primary: "bg-[#116B63] hover:bg-[#0B4945] text-white focus:ring-[#116B63] shadow-sm",
    secondary: "bg-[#EAF5F1] hover:bg-[#D5EBE4] text-[#0B4945] focus:ring-[#116B63] font-semibold",
    outline: "border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#172B2A] hover:bg-slate-50 focus:ring-[#116B63]",
    ghost: "bg-transparent hover:bg-slate-100 text-[#172B2A] focus:ring-[#116B63]",
    danger: "bg-[#C24141] hover:bg-[#9B2C2C] text-white focus:ring-[#C24141]",
    success: "bg-[#16845B] hover:bg-[#116B4A] text-white focus:ring-[#16845B]",
  };

  const isInteractive = !loading && !disabled;

  return (
    <button
      type={type}
      disabled={!isInteractive}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSizes[size] || 18} className="animate-spin shrink-0" aria-hidden="true" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={iconSizes[size] || 18} className="shrink-0" aria-hidden="true" />
      ) : null}

      <span className="leading-none whitespace-nowrap">{children}</span>

      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={iconSizes[size] || 18} className="shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
