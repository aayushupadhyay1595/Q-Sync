import React from 'react';
import { TokenStatus, PriorityCategory } from '@/lib/types';
import { Clock, Bell, UserCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export function StatusBadge({ status, className = '' }: { status: TokenStatus; className?: string }) {
  switch (status) {
    case 'waiting':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}>
          <Clock className="w-3.5 h-3.5" />
          Waiting
        </span>
      );
    case 'called':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400 animate-pulse ${className}`}>
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          Called
        </span>
      );
    case 'serving':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <UserCheck className="w-3.5 h-3.5" />
          Serving Now
        </span>
      );
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Completed
        </span>
      );
    case 'skipped':
    case 'no_show':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {status === 'no_show' ? 'No-Show' : 'Skipped'}
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}>
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    case 'transferred':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}>
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Transferred
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-800 ${className}`}>
          {status}
        </span>
      );
  }
}

export function PriorityBadge({ priority }: { priority: PriorityCategory }) {
  if (priority === 'standard') return null;

  const colorMap: Record<string, string> = {
    emergency: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold',
    senior: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    accessible: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    vip: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  };

  return (
    <span className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded border font-medium ${colorMap[priority] || 'bg-slate-700 text-slate-300'}`}>
      {priority}
    </span>
  );
}
