'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MonitorCheck, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  RotateCcw,
  HeartPulse,
  Building2,
  Stethoscope,
  Coins
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { Service, Token, PriorityCategory } from '@/lib/types';
import { QrCodeDisplay } from '@/components/QrCodeDisplay';

export default function KioskPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [priority, setPriority] = useState<PriorityCategory>('standard');
  const [name, setName] = useState('');
  const [issuedToken, setIssuedToken] = useState<Token | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const srvs = dataLayer.getServices();
    setServices(srvs);
  }, []);

  // Auto-reset kiosk after token print
  useEffect(() => {
    if (!issuedToken) return;
    setCountdown(15);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleResetKiosk();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [issuedToken]);

  const handleIssueToken = (srv: Service) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = dataLayer.issueToken({
        serviceId: srv.id,
        customerName: name.trim() || 'Kiosk Visitor',
        priority,
        notes: 'Issued via Self-Service Entrance Kiosk'
      });
      setIssuedToken(token);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetKiosk = () => {
    setIssuedToken(null);
    setSelectedService(null);
    setPriority('standard');
    setName('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-6 sm:p-10 select-none">
      
      {/* Top Header */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <MonitorCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Q-Sync Kiosk Terminal</h1>
            <p className="text-xs text-slate-400">Self-Service Touchscreen Dispensary</p>
          </div>
        </div>

        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          Exit Kiosk
        </Link>
      </header>

      {/* Main Kiosk Body */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-8">
        
        {issuedToken ? (
          /* Confirmed Printed Slip View */
          <div className="max-w-md mx-auto w-full p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/60 shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Please Take Your Ticket
              </span>
              <div className="text-6xl font-black text-white font-mono tracking-tight my-2">
                {issuedToken.display_number}
              </div>
              <p className="text-sm font-semibold text-blue-300">
                {issuedToken.service_name}
              </p>
            </div>

            <div className="flex justify-center">
              <QrCodeDisplay 
                refCode={issuedToken.ref_code} 
                displayNumber={issuedToken.display_number} 
                size={140} 
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>Public Reference: <code className="font-mono font-bold text-white">{issuedToken.ref_code}</code></div>
              <div className="text-slate-400">Watch the hall display screen for your token call.</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ticket</span>
              </button>

              <button
                onClick={handleResetKiosk}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Done ({countdown}s)
              </button>
            </div>
          </div>
        ) : (
          /* Service Touch Selection */
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Touch a Service to Dispense Token
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Tap your requested service below. Your digital ticket will be issued immediately.
              </p>
            </div>

            {/* Priority Selector for Accessible / Senior */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Select Care Category:</span>
              {[
                { id: 'standard', label: 'Standard Visitor' },
                { id: 'senior', label: 'Senior Citizen' },
                { id: 'accessible', label: 'Wheelchair / Accessible' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setPriority(cat.id as PriorityCategory)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    priority === cat.id
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Big Touch Service Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((srv) => {
                const qState = dataLayer.getQueueState(srv.id);
                return (
                  <button
                    key={srv.id}
                    disabled={isSubmitting || qState.is_paused}
                    onClick={() => handleIssueToken(srv)}
                    className="p-6 rounded-3xl bg-slate-900 hover:bg-blue-600/15 border-2 border-slate-800 hover:border-blue-500 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {srv.code_prefix}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          {qState.currently_waiting} waiting
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        {srv.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {srv.description || 'General consultation service.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        ~{qState.average_wait_minutes} mins wait
                      </span>
                      <span className="font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                        Touch to Issue &rarr;
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </main>

      <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
        Q-Sync Touch Terminal &bull; Automatic daily sequence reset &bull; Sanitized public kiosk
      </footer>

    </div>
  );
}
