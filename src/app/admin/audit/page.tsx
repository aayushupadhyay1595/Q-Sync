'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Filter, 
  Clock, 
  User 
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { AuditLogEntry } from '@/lib/types';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    setLogs(dataLayer.getAuditLogs());
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = filterAction === 'all' ? true : log.action.includes(filterAction);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Center</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Security &amp; Operational Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Immutable timeline of token state transitions, manual overrides, staff actions, and queue pauses.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by actor, token, or reason..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Actions</option>
            <option value="CALL_NEXT">Call Next</option>
            <option value="COMPLETE">Completions</option>
            <option value="SKIP">Skips &amp; No-Shows</option>
            <option value="OVERRIDE">Manual Overrides</option>
            <option value="TRANSFER">Transfers</option>
            <option value="QUEUE">Queue Pauses</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Mandatory Reason / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records found matching your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        log.action.includes('OVERRIDE') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        log.action.includes('SKIP') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        log.action.includes('CALL') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        log.action.includes('COMPLETE') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {log.actor_name}
                      <span className="text-[10px] text-slate-500 block font-normal capitalize">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
