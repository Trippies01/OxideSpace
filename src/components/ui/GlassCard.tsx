import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassCard = ({ children, className = "" }: GlassCardProps) => (
    <div className={`backdrop-blur-md bg-[#121217]/92 border border-white/[0.06] shadow-xl shadow-black/20 ${className}`}>
        {children}
    </div>
);
