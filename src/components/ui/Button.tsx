import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    primary?: boolean;
    danger?: boolean;
    success?: boolean;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    icon?: React.ComponentType<{ size?: number | string }>;
}

export const Button = ({ children, primary, danger, success, onClick, className = "", disabled, icon: Icon }: ButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-6 py-2.5 rounded-xl font-medium transition-colors duration-150 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none
      ${primary
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40'
                : danger
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                    : success
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20'
                        : 'bg-white/5 text-zinc-200 hover:bg-white/10 border border-white/5 hover:border-white/10'} 
      ${className}`}
    >
        {Icon && <Icon size={18} />}
        {children}
    </button>
);
