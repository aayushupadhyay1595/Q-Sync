'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Sparkles, 
  QrCode, 
  Layers, 
  Stethoscope, 
  Clock, 
  Users,
  Radio,
  Pause
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { Service, ServiceCounter, Token, QueueState } from '@/lib/types';
import { audioAnnouncer } from '@/lib/audio';
import { QrCodeDisplay } from '@/components/QrCodeDisplay';

export default function PublicDisplayPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [counters, setCounters] = useState<ServiceCounter[]>([]);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [allTokens, setAllTokens] = useState<Token[]>([]);

  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastCalledId, setLastCalledId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const srvs = dataLayer.getServices();
    setServices(srvs);
    if (srvs.length > 0) setSelectedServiceId(srvs[0].id);

    setCounters(dataLayer.getCounters());
    setIsMuted(audioAnnouncer.getMuted());

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedServiceId) return;

    const refresh = () => {
      const qState = dataLayer.getQueueState(selectedServiceId);
      setQueueState(qState);
      const tokens = dataLayer.getTokens(selectedServiceId);
      setAllTokens(tokens);

      // Check if a new token was just called and announce it
      const currentCalled = tokens.find(t => t.status === 'called');
      if (currentCalled && currentCalled.id !== lastCalledId) {
        setLastCalledId(currentCalled.id);
        audioAnnouncer.announceToken(currentCalled.display_number, currentCalled.counter_name || 'Designated Counter');
      }
    };

    refresh();
    const unsubscribe = dataLayer.subscribe(refresh);
    return () => unsubscribe();
  }, [selectedServiceId, lastCalledId]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioAnnouncer.setMuted(next);
    if (!next) audioAnnouncer.playChime();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const calledTokens = allTokens.filter(t => t.status === 'called' || t.status === 'serving').slice(0, 4);
  const waitingTokens = allTokens.filter(t => t.status === 'waiting').slice(0, 8);
  const heroToken = calledTokens[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      
      {/* Top Header Bar */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">Q-Sync</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                HALL DISPLAY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {selectedService?.name || 'Department Waiting Screen'}
            </p>
          </div>
        </div>

        {/* Real-time Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-sm">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{currentTime || '08:00:00'}</span>
          </div>

          {/* Service Switcher */}
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Turn Sound On' : 'Mute Sound'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle TV Fullscreen"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Display Area */}
      <main className="flex-1 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Massive Now Serving Banner */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
          
          {queueState?.is_paused ? (
            <div className="p-12 rounded-3xl bg-amber-950/40 border-2 border-amber-500/50 text-center flex flex-col items-center justify-center my-auto">
              <Pause className="w-16 h-16 text-amber-400 animate-pulse mb-4" />
              <h2 className="text-3xl font-black text-amber-300">QUEUE TEMPORARILY PAUSED</h2>
              <p className="text-sm text-slate-300 mt-2 max-w-md">
                Consultations will resume shortly. Please retain your position in the waiting area.
              </p>
            </div>
          ) : heroToken ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-950/90 via-slate-900 to-indigo-950/90 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 text-center flex flex-col items-center justify-center my-auto animate-pulse-glow">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 font-bold text-xs uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <span>NOW SERVING</span>
              </div>

              {/* Huge Token Typography */}
              <div className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-white drop-shadow-2xl">
                {heroToken.display_number}
              </div>

              {/* Destination Station */}
              <div className="mt-6 px-6 py-3 rounded-2xl bg-slate-950/80 border border-blue-400/50 inline-flex items-center gap-3">
                <Stethoscope className="w-6 h-6 text-cyan-400" />
                <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
                  {heroToken.counter_name || 'Counter 1'}
                </span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-400 font-medium">
                Please proceed directly to the designated consultation room.
              </p>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center my-auto">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-slate-300">WAITING FOR NEXT CALL</h2>
              <p className="text-xs text-slate-500 mt-1">Please have your digital ticket ready.</p>
            </div>
          )}

          {/* Sub-grid of other active / recently called counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {counters.map((c) => {
              const assignedToken = allTokens.find(t => (t.status === 'called' || t.status === 'serving') && t.counter_id === c.id);
              return (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block truncate font-medium">{c.name}</span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                    {assignedToken ? assignedToken.display_number : '—'}
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider inline-block mt-1 px-2 py-0.5 rounded ${
                    assignedToken ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {assignedToken ? assignedToken.status : 'Ready'}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right 1 Col: Waiting List & Join QR Code */}
        <div className="flex flex-col justify-between space-y-6">
          
          {/* Waiting Queue Roster */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Up Next In Queue
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {queueState?.currently_waiting || 0} waiting
              </span>
            </div>

            <div className="space-y-2 mt-4 flex-1">
              {waitingTokens.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No patients currently waiting in line.
                </div>
              ) : (
                waitingTokens.map((t, idx) => (
                  <div 
                    key={t.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      idx === 0 
                        ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 font-bold' 
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-base font-black">
                        {t.display_number}
                      </span>
                    </div>

                    <span className="text-[11px] uppercase tracking-wider font-semibold">
                      {idx === 0 ? 'Next' : 'Waiting'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Waiting Room QR Code to Join / Track */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center">
            <span className="text-xs font-bold text-white block mb-1">
              Scan With Your Phone
            </span>
            <p className="text-[11px] text-slate-400 mb-3">
              Get your digital ticket or track live position from your smartphone.
            </p>
            <div className="flex justify-center">
              <QrCodeDisplay refCode="QS-HALL-JOIN" displayNumber="JOIN-QUEUE" size={130} />
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Ticker */}
      <footer className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Real-time PA announcements enabled &bull; Please watch the screen for your number</span>
        </div>
        <Link href="/" className="hover:text-white transition-colors">
          Exit Display
        </Link>
      </footer>

    </div>
  );
}
