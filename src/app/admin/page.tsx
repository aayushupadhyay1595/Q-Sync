'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  BarChart3, 
  FileText, 
  Layers, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  HeartPulse, 
  SlidersHorizontal,
  Download,
  Building2,
  Stethoscope,
  Activity
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { 
  Service, 
  ServiceCounter, 
  QueueHealthRecommendation, 
  Token, 
  AuditLogEntry 
} from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminOverviewPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [counters, setCounters] = useState<ServiceCounter[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [recommendations, setRecommendations] = useState<QueueHealthRecommendation[]>([]);
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => {
      setServices(dataLayer.getServices());
      setCounters(dataLayer.getCounters());
      setTokens(dataLayer.getTokens());
      setRecommendations(dataLayer.getHealthRecommendations());
    };
    refresh();
    const unsub = dataLayer.subscribe(refresh);
    return () => unsub();
  }, []);

  const totalIssuedToday = tokens.length;
  const waitingCount = tokens.filter(t => t.status === 'waiting').length;
  const servingCount = tokens.filter(t => t.status === 'serving').length;
  const completedCount = tokens.filter(t => t.status === 'completed').length;
  const skippedCount = tokens.filter(t => t.status === 'skipped' || t.status === 'no_show').length;

  const handleDismissRec = (id: string) => {
    setDismissedRecs(prev => [...prev, id]);
  };

  const activeRecs = recommendations.filter(r => !dismissedRecs.includes(r.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              Enterprise Facility Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            System Control Center
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/analytics"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Deep Analytics</span>
          </Link>

          <Link
            href="/admin/audit"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit &amp; Overrides</span>
          </Link>
        </div>
      </div>

      {/* Health & Congestion Indicators */}
      {activeRecs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4" />
            <span>Automated Queue Health &amp; Load Recommendations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRecs.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start justify-between gap-4 shadow-lg"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{rec.title}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{rec.message}</p>
                  <p className="text-amber-400 font-semibold pt-1">
                    Action: {rec.suggested_action}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Link
                    href="/controller"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] text-center hover:bg-amber-400 cursor-pointer"
                  >
                    Open Counter
                  </Link>
                  <button
                    onClick={() => handleDismissRec(rec.id)}
                    className="px-3 py-1 rounded-lg bg-slate-900 text-slate-400 text-[11px] hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Issued Today</span>
          <span className="text-3xl font-black text-white font-mono">{totalIssuedToday}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Unique tokens</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Waiting In Line</span>
          <span className="text-3xl font-black text-amber-400 font-mono">{waitingCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Active backlog</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Currently Serving</span>
          <span className="text-3xl font-black text-emerald-400 font-mono">{servingCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">In consultation</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Completed</span>
          <span className="text-3xl font-black text-blue-400 font-mono">{completedCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Satisfied today</span>
        </div>

        <div className="col-span-2 md:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Skipped / No-Show</span>
          <span className="text-3xl font-black text-rose-400 font-mono">{skippedCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Audit tracked</span>
        </div>
      </div>

      {/* Service Lines Directory */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Active Service Lines &amp; Department Queues</h3>
            <p className="text-xs text-slate-400">Configure target durations, token prefixes, and capacity limits.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => {
            const qState = dataLayer.getQueueState(s.id);
            return (
              <div key={s.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {s.code_prefix}
                    </span>
                    <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    qState.load_level === 'congested' ? 'bg-rose-500/20 text-rose-300' :
                    qState.load_level === 'busy' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    Load: {qState.load_level}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">Waiting</span>
                    <span className="font-mono font-bold text-amber-400">{qState.currently_waiting}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">Avg Wait</span>
                    <span className="font-mono font-bold text-cyan-400">~{qState.average_wait_minutes}m</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900">
                    <span className="text-[10px] text-slate-400 block">Target Cycle</span>
                    <span className="font-mono font-bold text-slate-300">{s.avg_duration_minutes}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counters & Physical Consultation Stations */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white">Physical Service Counters &amp; Staff Assignments</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {counters.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-blue-400">{c.code}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  c.status === 'busy' ? 'bg-blue-500/20 text-blue-300' :
                  c.status === 'available' ? 'bg-emerald-500/20 text-emerald-300' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {c.status}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">{c.name}</h4>
              <p className="text-xs text-slate-400">
                Staff: {c.assigned_staff_name || 'Unassigned'}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
