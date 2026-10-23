'use client';

import React, { useState, useEffect } from 'react';
import { SmartNotification, NotificationStage } from '@/lib/types';
import { Bell, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { audioAnnouncer } from '@/lib/audio';

export function LiveNotificationBanner({ notification }: { notification: SmartNotification | null }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<SmartNotification | null>(null);

  useEffect(() => {
    if (notification) {
      setCurrent(notification);
      setVisible(true);
      // Play chime when new notification arrives
      audioAnnouncer.playChime();

      if (notification.stage === 'stage_3_called' && notification.counter_name) {
        audioAnnouncer.announceToken(notification.display_number, notification.counter_name);
      }
    }
  }, [notification]);

  if (!visible || !current) return null;

  const isStage3 = current.stage === 'stage_3_called';
  const isStage2 = current.stage === 'stage_2_next_in_line';

  return (
    <aside 
      aria-label="Queue notification"
      className={`fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 p-4 rounded-xl shadow-2xl border transition-all duration-300 ${
      isStage3 
        ? 'bg-blue-950/95 border-blue-400 text-white shadow-blue-500/30 animate-pulse-glow'
        : isStage2
        ? 'bg-amber-950/95 border-amber-500/50 text-white shadow-amber-500/20'
        : 'bg-slate-900/95 border-slate-700 text-white'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg mt-0.5 ${
            isStage3 ? 'bg-blue-600 text-white animate-bounce' : isStage2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">
                {current.title}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white/10 border border-white/20">
                {current.display_number}
              </span>
            </div>
            <p className="text-xs mt-1 text-slate-200 leading-relaxed">
              {current.message}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setVisible(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
