import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  // Verification status
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  
  // Appointment status
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-200',
  completed: 'bg-slate-50 text-slate-700 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-orange-50 text-orange-700 border-orange-200',
  
  // Payment status
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
  
  // Prescription status
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  dispensed: 'bg-slate-50 text-slate-700 border-slate-200',
  partially_dispensed: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  
  // Order status
  preparing: 'bg-amber-50 text-amber-700 border-amber-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  out_for_delivery: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-slate-50 text-slate-700 border-slate-200',
  
  // Urgency levels
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
  
  // Lab values
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  
  // General
  online: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  offline: 'bg-slate-50 text-slate-700 border-slate-200',
  clinic: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function StatusBadge({ status, className, children }) {
  const style = statusStyles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = children || status?.replace(/_/g, ' ');
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}