'use client';

import React, { useState } from 'react';
import { Token } from '@/lib/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { QrCodeDisplay } from './QrCodeDisplay';
import { 
  Clock, 
  Users, 
  MapPin, 
  Stethoscope, 
  BellRing, 
  XCircle, 
  Share2, 
  Check, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';
import { dataLayer } from '@/lib/data-layer';

export function TokenCard({ 
  token, 
  onCancel 
}: { 
  token: Token; 
  onCancel?: () => void;
}) {
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted) {
      alert('Browser notifications enabled! You will receive instant alerts when your turn approaches.');
    }
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCancelClick = () => {
    if (confirm(`Are you sure you want to cancel token ${token.display_number}? This cannot be undone.`)) {
      setCancelling(true);
      dataLayer.cancelToken(token.id, 'Customer requested cancellation');
      if (onCancel) onCancel();
      setCancelling(false);
    }
  };

  const isServing = token.status === 'serving';
  const isCalled = token.status === 'called';
  const isWaiting = token.status === 'waiting';
  const isFinished = ['completed', 'cancelled', 'skipped'].includes(token.status);

  return (
    <div className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl ${
      isCalled 
        ? 'bg-gradient-to-b from-blue-950/80 to-slate-900 border-blue-400 shadow-blue-500/20 animate-pulse-glow' 
        : isServing
        ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-500/50 shadow-emerald-500/10'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={token.status} />
          <PriorityBadge priority={token.priority} />
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-mono">REF:</span>{' '}
          <span className="text-xs font-mono font-bold text-slate-200">{token.ref_code}</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          {/* Main Token Display */}
          <div className="text-center md:text-left flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block mb-1">
              Your Digital Token
            </span>
            <div className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono drop-shadow-md">
              {token.display_number}
            </div>

            <h3 className="text-lg font-bold text-slate-200 mt-3">
              {token.service_name || 'Consultation Service'}
            </h3>
            <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {token.department_name || 'Department Clinic'}
            </p>

            {/* Doctor / Assigned Counter */}
            {token.counter_name && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                <Stethoscope className="w-4 h-4 text-blue-400" />
                <span>Assigned to: {token.counter_name}</span>
              </div>
            )}
          </div>

          {/* QR Code Ticket */}
          <div className="flex-shrink-0">
            <QrCodeDisplay refCode={token.ref_code} displayNumber={token.display_number} size={150} />
          </div>
        </div>

        {/* Live Metrics Grid (Only active if waiting or called) */}
        {!isFinished && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            {/* Position Ahead */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>People Ahead</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {isCalled || isServing ? 0 : (token.people_ahead ?? 0)}
              </div>
              <span className="text-[11px] text-slate-500">
                {token.people_ahead === 0 ? 'You are next' : 'Eligible in line'}
              </span>
            </div>

            {/* Estimated Wait */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Estimated Wait</span>
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {isCalled || isServing ? 'Now' : `~${token.estimated_wait_minutes ?? 10}m`}
              </div>
              <span className="text-[11px] text-slate-500">
                Dynamic estimate
              </span>
            </div>

            {/* Call Status */}
            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Status</span>
              </div>
              <div className="text-base font-bold text-cyan-300 capitalize">
                {token.status}
              </div>
              <span className="text-[11px] text-slate-500">
                Calls: {token.call_count || 0}
              </span>
            </div>
          </div>
        )}

        {/* Turn-approach Alert Callout */}
        {isCalled && (
          <div className="mt-6 p-4 rounded-2xl bg-blue-600/20 border border-blue-400/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-lg animate-bounce">
              !
            </div>
            <div>
              <div className="font-extrabold text-white text-sm">
                YOUR TURN IS CALLED NOW!
              </div>
              <p className="text-xs text-blue-200">
                Please proceed directly to {token.counter_name || 'the service room'}. Present your QR code ticket upon arrival.
              </p>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!notificationEnabled && !isFinished && (
              <button
                onClick={handleEnablePush}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 transition-all cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                Turn On Push Alerts
              </button>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Link Copied!' : 'Copy Ticket Link'}
            </button>
          </div>

          {/* Cancel button (allowed only while waiting) */}
          {isWaiting && (
            <button
              onClick={handleCancelClick}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel My Token
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
