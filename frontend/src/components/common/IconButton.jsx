import React from 'react';

export default function IconButton({
  icon: Icon,
  label,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 22,
  };

  const variantStyles = {
    ghost: "text-[#64748B] hover:text-[#172B2A] hover:bg-slate-100",
    outline: "border border-[#E2E8F0] text-[#64748B] hover:text-[#172B2A] bg-white hover:bg-slate-50",
    primary: "bg-[#116B63] text-white hover:bg-[#0B4945]",
    secondary: "bg-[#EAF5F1] text-[#0B4945] hover:bg-[#D5EBE4]",
    danger: "text-[#C24141] hover:bg-red-50",
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#116B63] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${sizeMap[size] || sizeMap.md} ${variantStyles[variant] || variantStyles.ghost} ${className}`}
      {...props}
    >
      <Icon size={iconSizes[size] || 18} className="shrink-0" aria-hidden="true" />
    </button>
  );
}
