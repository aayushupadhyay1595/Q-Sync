'use client';

import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  UserCheck, 
  Bell, 
  ArrowRight, 
  RotateCw, 
  Pause, 
  Play, 
  SkipForward, 
  Volume2, 
  Plus, 
  ArrowRightLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Users,
  Building2,
  Stethoscope,
  Filter
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { 
  Service, 
  ServiceCounter, 
  Token, 
  QueueState, 
  PriorityCategory, 
  AuditLogEntry 
} from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { audioAnnouncer } from '@/lib/audio';

export default function QueueControllerPage() {
  // Config state
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [counters, setCounters] = useState<ServiceCounter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  
  // Staff info
  const [staffName, setStaffName] = useState<string>('Dr. Ananya Sharma');

  // Queue data
  const [tokens, setTokens] = useState<Token[]>([]);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal Dialogs
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPriority, setWalkInPriority] = useState<PriorityCategory>('standard');
  const [walkInPhone, setWalkInPhone] = useState('');

  const [skipModalToken, setSkipModalToken] = useState<Token | null>(null);
  const [skipReason, setSkipReason] = useState('Did not respond after multiple calls');

  const [transferModalToken, setTransferModalToken] = useState<Token | null>(null);
  const [transferTargetServiceId, setTransferTargetServiceId] = useState('');
  const [transferReason, setTransferReason] = useState('Requires specialist consultation');

  const [overrideModalToken, setOverrideModalToken] = useState<Token | null>(null);
  const [overridePriority, setOverridePriority] = useState<PriorityCategory>('emergency');
  const [overrideReason, setOverrideReason] = useState('Urgent clinical triage');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial data
  useEffect(() => {
    const srvs = dataLayer.getServices();
    setServices(srvs);
    if (srvs.length > 0) setSelectedServiceId(srvs[0].id);

    const cnts = dataLayer.getCounters();
    setCounters(cnts);
    if (cnts.length > 0) setSelectedCounterId(cnts[0].id);
  }, []);

  // Sync state on change
  useEffect(() => {
    if (!selectedServiceId) return;

    const refreshData = () => {
      const qState = dataLayer.getQueueState(selectedServiceId);
      setQueueState(qState);
      const allTokens = dataLayer.getTokens(selectedServiceId);
      setTokens(allTokens);
      setAuditLogs(dataLayer.getAuditLogs().slice(0, 10));
    };

    refreshData();
    const unsubscribe = dataLayer.subscribe(refreshData);
    return () => unsubscribe();
  }, [selectedServiceId]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3500);
  };

  // 1. CALL NEXT ELIGIBLE TOKEN
  const handleCallNext = () => {
    if (!selectedServiceId || !selectedCounterId) return;
    const res = dataLayer.callNextToken({
      serviceId: selectedServiceId,
      counterId: selectedCounterId,
      staffName
    });

    if (res.success && res.token) {
      showFeedback('success', `Called token ${res.token.display_number} to counter.`);
      audioAnnouncer.announceToken(res.token.display_number, res.token.counter_name || 'Counter');
    } else {
      showFeedback('error', res.message || 'No waiting tokens to call.');
    }
  };

  // 2. START SERVING
  const handleStartServing = (token: Token) => {
    const updated = dataLayer.startServingToken(token.id, staffName);
    if (updated) {
      showFeedback('success', `Started consultation for ${token.display_number}`);
    }
  };

  // 3. COMPLETE CURRENT TOKEN
  const handleCompleteCurrent = (token: Token) => {
    const updated = dataLayer.completeToken(token.id, selectedCounterId, staffName);
    if (updated) {
      showFeedback('success', `Completed service for ${token.display_number}`);
    }
  };

  // 4. COMPLETE & CALL NEXT (Atomic one-click hero action)
  const handleCompleteAndCallNext = (currentToken?: Token) => {
    const res = dataLayer.completeAndCallNext({
      currentTokenId: currentToken?.id,
      serviceId: selectedServiceId,
      counterId: selectedCounterId,
      staffName
    });

    if (res.nextTokenResult.success && res.nextTokenResult.token) {
      showFeedback('success', `Completed service and called ${res.nextTokenResult.token.display_number}`);
      audioAnnouncer.announceToken(
        res.nextTokenResult.token.display_number, 
        res.nextTokenResult.token.counter_name || 'Counter'
      );
    } else {
      showFeedback('success', 'Completed previous consultation. No further tokens waiting in queue.');
    }
  };

  // 5. RECALL PATIENT
  const handleRecall = (token: Token) => {
    const updated = dataLayer.recallToken(token.id, staffName);
    if (updated) {
      showFeedback('success', `Repeated announcement for ${token.display_number} (Call #${updated.call_count})`);
      audioAnnouncer.announceToken(token.display_number, token.counter_name || 'Counter');
    }
  };

  // 6. SKIP TOKEN
  const handleConfirmSkip = () => {
    if (!skipModalToken) return;
    dataLayer.skipToken(skipModalToken.id, skipReason, staffName);
    showFeedback('success', `Token ${skipModalToken.display_number} marked as skipped.`);
    setSkipModalToken(null);
  };

  // 7. TRANSFER TOKEN
  const handleConfirmTransfer = () => {
    if (!transferModalToken || !transferTargetServiceId) return;
    dataLayer.transferToken(transferModalToken.id, transferTargetServiceId, staffName, transferReason);
    showFeedback('success', `Token ${transferModalToken.display_number} transferred.`);
    setTransferModalToken(null);
  };

  // 8. MANUAL OVERRIDE
  const handleConfirmOverride = () => {
    if (!overrideModalToken) return;
    dataLayer.manualOverridePriority(overrideModalToken.id, overridePriority, staffName, overrideReason);
    showFeedback('success', `Priority for ${overrideModalToken.display_number} updated to ${overridePriority.toUpperCase()}.`);
    setOverrideModalToken(null);
  };

  // 9. PAUSE / RESUME QUEUE
  const handleTogglePause = () => {
    if (!selectedServiceId) return;
    const isNowPaused = dataLayer.toggleQueuePause(selectedServiceId, 'Staff intermission / transition');
    showFeedback('success', isNowPaused ? 'Queue has been paused.' : 'Queue has been resumed.');
  };

  // 10. ISSUE WALK-IN TOKEN
  const handleIssueWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    const newToken = dataLayer.issueToken({
      serviceId: selectedServiceId,
      customerName: walkInName.trim() || 'Walk-In Visitor',
      customerPhone: walkInPhone.trim(),
      priority: walkInPriority,
      notes: 'Registered at receptionist desk'
    });
    showFeedback('success', `Issued walk-in token ${newToken.display_number}`);
    setWalkInOpen(false);
    setWalkInName('');
    setWalkInPhone('');
  };

  const selectedCounter = counters.find(c => c.id === selectedCounterId);
  const currentCalledToken = tokens.find(t => t.status === 'called' && t.counter_id === selectedCounterId);
  const currentServingToken = tokens.find(t => t.status === 'serving' && t.counter_id === selectedCounterId);
  const activeFocusToken = currentServingToken || currentCalledToken;

  // Filtered queue table
  const filteredTokens = tokens.filter(t => {
    const matchesSearch = 
      t.display_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ref_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner & Context Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              Operational Controller Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Queue Controller Desk
          </h1>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Station Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Service Selector */}
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:border-blue-500 focus:outline-none"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code_prefix})
              </option>
            ))}
          </select>

          {/* Counter Selector */}
          <select
            value={selectedCounterId}
            onChange={(e) => setSelectedCounterId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:border-blue-500 focus:outline-none"
          >
            {counters.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Pause / Resume Button */}
          <button
            onClick={handleTogglePause}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              queueState?.is_paused
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-amber-600/20 border-amber-500 text-amber-300 hover:bg-amber-600/30'
            }`}
          >
            {queueState?.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{queueState?.is_paused ? 'Resume Queue' : 'Pause Queue'}</span>
          </button>

          {/* Issue Walk-In Token Button */}
          <button
            onClick={() => setWalkInOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Walk-In Token</span>
          </button>
        </div>
      </div>

      {/* Main Hero Controller Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Token Station & Hero Calling Buttons */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Active Station Focus
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {selectedCounter?.name || 'Counter 1'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Duty Officer:</span>
              <span className="text-xs font-bold text-blue-300">{staffName}</span>
            </div>
          </div>

          {/* Current Active Token Focus Banner */}
          {activeFocusToken ? (
            <div className={`p-6 rounded-2xl border transition-all ${
              activeFocusToken.status === 'serving'
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : 'bg-blue-950/40 border-blue-500/60 animate-flash-call'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status={activeFocusToken.status} />
                    <PriorityBadge priority={activeFocusToken.priority} />
                    <span className="text-xs text-slate-400 font-mono">Ref: {activeFocusToken.ref_code}</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                    {activeFocusToken.display_number}
                  </div>
                  <div className="mt-2 text-xs text-slate-300 flex items-center gap-2">
                    <span className="font-semibold">{activeFocusToken.customer_name || 'Patient'}</span>
                    {activeFocusToken.customer_phone && (
                      <span className="text-slate-400">&bull; {activeFocusToken.customer_phone}</span>
                    )}
                  </div>
                </div>

                {/* Sub-actions for current token */}
                <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
                  {activeFocusToken.status === 'called' && (
                    <button
                      onClick={() => handleStartServing(activeFocusToken)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Start Serving</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRecall(activeFocusToken)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recall Patient</span>
                  </button>

                  <button
                    onClick={() => setSkipModalToken(activeFocusToken)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Skip / No-Show</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="font-bold text-slate-300 text-sm">Station is currently idle</h4>
              <p className="text-xs text-slate-500 mt-1">
                Tap <strong>Call Next Token</strong> below to advance the queue.
              </p>
            </div>
          )}

          {/* High-Velocity Queue Advancing Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Primary Action: COMPLETE & CALL NEXT */}
            <button
              onClick={() => handleCompleteAndCallNext(activeFocusToken)}
              className="py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>Complete &amp; Call Next</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Alternative Action: CALL NEXT ONLY */}
            <button
              onClick={handleCallNext}
              className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Call Next Eligible</span>
            </button>

          </div>

          {/* Quick Metrics Bar */}
          {queueState && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-center">
              <div className="p-3 rounded-xl bg-slate-950/60">
                <span className="text-[11px] text-slate-400 block">Waiting In Line</span>
                <span className="text-xl font-black text-amber-400 font-mono">{queueState.currently_waiting}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60">
                <span className="text-[11px] text-slate-400 block">Next Ready</span>
                <span className="text-xl font-black text-blue-400 font-mono">
                  {queueState.next_eligible_token?.display_number || 'None'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60">
                <span className="text-[11px] text-slate-400 block">Issued Today</span>
                <span className="text-xl font-black text-white font-mono">{queueState.total_issued_today}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60">
                <span className="text-[11px] text-slate-400 block">Avg Wait</span>
                <span className="text-xl font-black text-cyan-400 font-mono">~{queueState.average_wait_minutes}m</span>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Live Audit & Activity Stream */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Station Activity Log</h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">LIVE FEED</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-semibold text-blue-400">{log.action}</span>
                  <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <p className="text-slate-200 text-xs">{log.description}</p>
                <div className="text-[10px] text-slate-500">By: {log.actor_name}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Queue Table & Management */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-white text-lg">Full Queue Directory</h3>
            <p className="text-xs text-slate-400">View waiting, active, and completed patient tokens for this service.</p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token or name..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting Only</option>
              <option value="called">Called</option>
              <option value="serving">Serving</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped / No-show</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Visitor / Patient</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No tokens found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((t) => {
                  const minutesWaiting = Math.round((Date.now() - new Date(t.created_at).getTime()) / 60000);
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                        {t.display_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{t.customer_name || 'Visitor'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.ref_code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {minutesWaiting}m ago
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {t.counter_name || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'waiting' && (
                            <>
                              <button
                                onClick={() => setTransferModalToken(t)}
                                title="Transfer to another department"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setOverrideModalToken(t)}
                                title="Manual priority override"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {t.status === 'called' && (
                            <button
                              onClick={() => handleStartServing(t)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold"
                            >
                              Serve
                            </button>
                          )}
                          {t.status === 'serving' && (
                            <button
                              onClick={() => handleCompleteCurrent(t)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: Walk-In Token Registration --- */}
      {walkInOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Issue Walk-In Token</h3>
            <p className="text-xs text-slate-400">Quickly register an in-person arrival at the desk.</p>

            <form onSubmit={handleIssueWalkIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Visitor Name</label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={walkInPriority}
                  onChange={(e) => setWalkInPriority(e.target.value as PriorityCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="standard">Standard</option>
                  <option value="senior">Senior Citizen</option>
                  <option value="accessible">Accessible / PwD</option>
                  <option value="emergency">Emergency / Triage</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalkInOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500"
                >
                  Issue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Skip / No-Show --- */}
      {skipModalToken && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Skip Token {skipModalToken.display_number}</h3>
            <p className="text-xs text-slate-400">Record a reason for skipping this patient to maintain audit compliance.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason for Skip</label>
                <select
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="Did not respond after multiple calls">Did not respond after multiple calls</option>
                  <option value="Patient requested later slot">Patient requested later slot</option>
                  <option value="Missing medical documents/tests">Missing medical documents/tests</option>
                  <option value="Patient not present in lobby">Patient not present in lobby</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSkipModalToken(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSkip}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
                >
                  Confirm Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Transfer Token --- */}
      {transferModalToken && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Transfer Token {transferModalToken.display_number}</h3>
            <p className="text-xs text-slate-400">Move patient to another queue while preserving their original creation timestamp.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destination Service</label>
                <select
                  value={transferTargetServiceId}
                  onChange={(e) => setTransferTargetServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="">Select Target Service...</option>
                  {services.filter(s => s.id !== transferModalToken.service_id).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Reason</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Sent for urgent blood test"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalToken(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTransfer}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500"
                >
                  Transfer Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Manual Priority Override --- */}
      {overrideModalToken && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Priority Override: {overrideModalToken.display_number}</h3>
            <p className="text-xs text-slate-400">Override token sequence. All manual overrides are logged with staff identity.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Priority Category</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value as PriorityCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="emergency">Emergency / Critical</option>
                  <option value="senior">Senior Citizen</option>
                  <option value="accessible">Accessible / PwD</option>
                  <option value="vip">VIP</option>
                  <option value="standard">Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mandatory Override Reason</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Acute chest pain triage by nursing staff"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalToken(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOverride}
                  className="flex-1 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500"
                >
                  Apply Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
