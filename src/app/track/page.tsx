'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Ticket, Clock, ArrowRight, QrCode } from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { Token } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function TrackLookupPage() {
  const router = useRouter();
  const [refInput, setRefInput] = useState('');
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const history = dataLayer.getCustomerTokenHistory();
    setRecentTokens(history);
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = refInput.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a public reference code or token number.');
      return;
    }

    const token = dataLayer.getTokenByRef(clean) || dataLayer.getTokens().find(t => t.display_number.toUpperCase() === clean);
    if (!token) {
      setError(`No active token found matching "${clean}". Please verify your ticket.`);
      return;
    }

    router.push(`/track/${token.ref_code}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Live Status Tracker
        </span>
        <h1 className="text-3xl font-black text-white mt-1">Track Your Position in Line</h1>
        <p className="text-xs text-slate-400 mt-2">
          Enter your 8-character public reference code (e.g. <code>QS-A91B4C</code>) or token number.
        </p>
      </div>

      {/* Lookup Box */}
      <form onSubmit={handleLookup} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="e.g. QS-A91B4C or OPD-025"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono uppercase text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <span>Track Token</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Recent Tokens on this device */}
      {recentTokens.length > 0 && (
        <div className="mt-12 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            Your Active & Recent Tickets
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentTokens.map((t) => (
              <Link
                key={t.id}
                href={`/track/${t.ref_code}`}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-black text-lg text-white group-hover:text-blue-400">
                      {t.display_number}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">
                    {t.service_name || 'Consultation'}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Ref: {t.ref_code}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-blue-400 font-semibold group-hover:translate-x-1 transition-transform inline-block">
                    View &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Alternative options */}
      <div className="mt-12 p-6 rounded-2xl bg-slate-950/60 border border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="font-bold text-white text-sm">Need a new token?</h4>
          <p className="text-xs text-slate-400">Join the digital queue for hospital, bank, or clinic services.</p>
        </div>
        <Link
          href="/get-token"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Get New Token &rarr;
        </Link>
      </div>

    </div>
  );
}
