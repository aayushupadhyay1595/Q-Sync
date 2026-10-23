'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Ticket, 
  Search, 
  SlidersHorizontal, 
  Tv, 
  MonitorCheck, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Users, 
  Sparkles, 
  BellRing, 
  Smartphone, 
  Building2, 
  Hospital, 
  Landmark, 
  FlaskConical, 
  GraduationCap, 
  Scissors,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { QueueState } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function LandingPage() {
  const [queueState, setQueueState] = useState<QueueState | null>(null);

  useEffect(() => {
    const refresh = () => {
      const services = dataLayer.getServices();
      if (services.length > 0) {
        setQueueState(dataLayer.getQueueState(services[0].id));
      }
    };
    refresh();
    return dataLayer.subscribe(refresh);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Smart Queue Management</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Skip the line. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Not your time.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Q-Sync digitizes physical waiting lines into seamless real-time digital journeys. Issue atomic tokens, notify customers as their turn approaches, and empower staff with a dedicated high-velocity controller desk.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/get-token"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-105 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Get a Digital Token</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Track My Token</span>
              </Link>
            </div>

            {/* Quick Demo Switcher Buttons */}
            <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 mr-1">Direct Operational Portals:</span>
              <Link 
                href="/controller" 
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-blue-300 font-medium transition-colors"
              >
                Controller Desk &rarr;
              </Link>
              <Link 
                href="/display" 
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-cyan-300 font-medium transition-colors"
              >
                Waiting Room TV &rarr;
              </Link>
              <Link 
                href="/kiosk" 
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-emerald-300 font-medium transition-colors"
              >
                Self-Service Kiosk &rarr;
              </Link>
              <Link 
                href="/admin" 
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-purple-300 font-medium transition-colors"
              >
                Admin Center &rarr;
              </Link>
            </div>

          </div>

          {/* Interactive Live Queue Preview Card */}
          {queueState && (
            <div className="mt-14 max-w-4xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                  <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                    Live Active Queue Engine
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {queueState.service_name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">Live Synchronized</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Now Serving</span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {queueState.currently_serving?.display_number || 'None'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1 truncate">
                    {queueState.currently_serving?.counter_name || 'Counter Ready'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Next In Line</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
                    {queueState.next_eligible_token?.display_number || 'None'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Ready to Call
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Waiting Backlog</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                    {queueState.currently_waiting}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Patients in line
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Est. Average Wait</span>
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                    ~{queueState.average_wait_minutes}m
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Based on durations
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium">Recent Calls:</span>
                  {queueState.recently_called.map((t) => (
                    <span key={t.id} className="px-2 py-0.5 rounded bg-slate-800 font-mono font-semibold text-slate-300">
                      {t.display_number}
                    </span>
                  ))}
                </div>
                <Link
                  href="/controller"
                  className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                >
                  Open in Queue Controller <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 3-Stage Smart Turn Approach Notification Feature */}
      <section className="py-20 bg-slate-950/70 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Zero Physical Congestion
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Smart Turn-Approach Notifications
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Patients do not need to stand in crowded corridors or stare at a ceiling screen. Q-Sync alerts them precisely as their turn approaches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Stage 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                Stage 1 &bull; 2 Patients Ahead
              </span>
              <h4 className="text-lg font-bold text-white mt-1">Get Ready Alert</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                When only approximately 2 eligible patients remain ahead, an advisory alert is sent advising the patient to wrap up nearby errands and head to the lobby.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-950 text-xs font-mono text-slate-300 border border-slate-800">
                &ldquo;Q-Sync: Your turn is approaching. Only 2 patients are ahead of you.&rdquo;
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                Stage 2 &bull; Next In Line
              </span>
              <h4 className="text-lg font-bold text-white mt-1">Standby Announcement</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                As soon as the preceding patient is called, the system immediately elevates priority for the next token holder to approach the designated consultation room door.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-950 text-xs font-mono text-amber-300 border border-slate-800">
                &ldquo;Q-Sync: You are next in line. Please return to the waiting area.&rdquo;
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                Stage 3 &bull; Token Called
              </span>
              <h4 className="text-lg font-bold text-white mt-1">Direct Room Call</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                The controller triggers the call. The patient's screen flashes with vibrational haptics, room number, doctor details, and audio announcement over the public PA.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-950 text-xs font-mono text-emerald-300 border border-slate-800">
                &ldquo;Q-Sync: Token OPD-025 is now called. Please proceed to Room 2.&rdquo;
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Supported Sectors */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Universal Application
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              Engineered for Every High-Traffic Facility
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              From busy multi-speciality hospitals to government visa counters and retail banks.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Hospital, name: 'Hospitals & OPD', desc: 'Doctors, triage, and pharmacy' },
              { icon: Landmark, name: 'Banking & Finance', desc: 'Tellers, loan officers, forex' },
              { icon: FlaskConical, name: 'Diagnostic Labs', desc: 'Blood draws, MRI, radiology' },
              { icon: Building2, name: 'Government Desks', desc: 'Passports, permits, revenue' },
              { icon: GraduationCap, name: 'Colleges & Univ', desc: 'Admissions, fees, registrar' },
              { icon: Scissors, name: 'Salons & Clinics', desc: 'Stylists, appointments, spa' },
            ].map((industry, i) => {
              const Icon = industry.icon;
              return (
                <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center hover:bg-slate-800/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{industry.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{industry.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 bg-slate-950/60 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Atomic Concurrency Safety</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL row locks and sequence counters prevent duplicate token numbers, double-clicks, and race conditions across multiple receptionists.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Tv className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Public Hall Display & PA Speech</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect any TV screen or monitor. Displays massive high-contrast current token numbers with automatic dual-tone chime and spoken room guidance.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <MonitorCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">One-Click Complete & Call Next</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Controllers move through queues in seconds without context-switching. Complete the current consultation and call the next eligible patient with a single tap.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Smart Wait-Time Moving Average</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates dynamic wait times based on actual recent consultation durations rather than static guesswork or naive token arithmetic.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Congestion & Counter Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time queue health monitoring warns administrators when wait times spike and suggests opening secondary counters to balance load.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Auditable Logs & Priority Triage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supports Senior Citizen, Emergency, and Accessible priorities. All skip reasons, manual overrides, and transfers are permanently logged.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Transparent Queue Rules & FAQ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white">Queue Rules & Policies</h2>
            <p className="text-xs text-slate-400 mt-1">Transparent principles guiding fair and predictable service delivery.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h4 className="font-bold text-white text-sm">How is queue ordering calculated?</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                By default, tokens are served in strict First-In First-Out (FIFO) sequence. Configured priority groups (such as Senior Citizens or Medical Emergencies) take precedence within the waiting backlog to ensure humane care.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h4 className="font-bold text-white text-sm">What happens if a customer is temporarily absent?</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Staff can use the <strong>Recall</strong> button to repeat the chime and announcement. If there is no response after multiple calls, staff can mark the token as <strong>Skipped</strong> with a recorded reason, allowing the queue to proceed smoothly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h4 className="font-bold text-white text-sm">Is my personal information displayed on waiting room monitors?</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Never. Public waiting room displays only show anonymous token numbers (e.g. <code>OPD-025</code>) and the assigned counter room. Phone numbers and full names remain private.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
