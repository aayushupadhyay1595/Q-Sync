'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { Token, SmartNotification } from '@/lib/types';
import { TokenCard } from '@/components/TokenCard';
import { LiveNotificationBanner } from '@/components/LiveNotificationBanner';
import { FeedbackForm } from '@/components/FeedbackForm';
import { dispatchTurnNotification } from '@/lib/notifications';

function LiveTokenTrackerContent() {
  const params = useParams();
  const router = useRouter();
  const refCode = (params?.ref as string) || '';

  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(1761273600000));
  const [activeNotification, setActiveNotification] = useState<SmartNotification | null>(null);

  useEffect(() => {
    if (!refCode) return;

    const loadToken = () => {
      const found = dataLayer.getTokenByRef(refCode);
      if (found) {
        setToken(found);
        setLastUpdated(new Date());

        // Check if smart notifications should be fired for this viewer
        if (found.status === 'called') {
          const notif = dispatchTurnNotification(found, 'stage_3_called', { counterName: found.counter_name });
          if (notif) setActiveNotification(notif);
        } else if (found.status === 'waiting') {
          if (found.people_ahead === 0) {
            const notif = dispatchTurnNotification(found, 'stage_2_next_in_line', { peopleAhead: 0 });
            if (notif) setActiveNotification(notif);
          } else if (found.people_ahead !== undefined && found.people_ahead <= 2) {
            const notif = dispatchTurnNotification(found, 'stage_1_two_ahead', { peopleAhead: found.people_ahead });
            if (notif) setActiveNotification(notif);
          }
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    };

    loadToken();

    // Subscribe to real-time events across tabs/devices!
    const unsubscribe = dataLayer.subscribe(loadToken);
    return () => unsubscribe();
  }, [refCode]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xs text-slate-400">Loading your real-time queue position...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Token Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">
          We could not locate any active token with reference code <code className="font-mono text-rose-300">{refCode}</code>.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/track"
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
          >
            Try Another Code
          </Link>
          <Link
            href="/get-token"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
          >
            Get a New Token
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = token.status === 'completed';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Live notification popup */}
      <LiveNotificationBanner notification={activeNotification} />

      {/* Top Navigation & Live Sync Status */}
      <div className="flex items-center justify-between">
        <Link
          href="/track"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tracker</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Synchronized &bull; {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Live Ticket Card */}
      <TokenCard token={token} onCancel={() => router.push('/track')} />

      {/* Feedback Section (Visible if completed) */}
      {isCompleted && (
        <div className="pt-4">
          <FeedbackForm tokenId={token.id} refCode={token.ref_code} />
        </div>
      )}

      {/* Live Progress Explainer */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
          Real-Time Turn Progression
        </h4>
        <p>
          You do not need to refresh this screen. As the queue controller calls or completes preceding patients, your position updates automatically.
        </p>
        <p className="text-slate-500 text-[11px]">
          Audio chimes and notification alerts will sound on this device when you are 2 spots away, next in line, and when your token is called.
        </p>
      </div>

    </div>
  );
}

export default function LiveTokenTrackerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xs text-slate-400">Loading queue tracker...</p>
      </div>
    }>
      <LiveTokenTrackerContent />
    </Suspense>
  );
}
