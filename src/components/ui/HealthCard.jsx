import React from 'react';
import { cn } from '@/lib/utils';

export default function HealthCard({ 
  children, 
  className, 
  gradient = false,
  hover = true,
  ...props 
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-6',
        'shadow-sm',
        hover && 'transition-all duration-300 hover:shadow-lg hover:shadow-slate-100/50 hover:-translate-y-0.5',
        gradient && 'bg-gradient-to-br from-white to-slate-50/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}