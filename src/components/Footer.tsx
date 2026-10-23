import React from 'react';
import Link from 'next/link';
import { Layers, Shield, HeartPulse, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Q-Sync</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise smart queue management system. Eliminating physical waiting lines for clinics, hospitals, banks, and public offices worldwide.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Queue Clusters Operational
            </div>
          </div>

          {/* Quick Portals */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Portals & Modes
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/get-token" className="hover:text-blue-400 transition-colors">
                  Customer Token Dispenser
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-blue-400 transition-colors">
                  Live Ticket Tracking
                </Link>
              </li>
              <li>
                <Link href="/controller" className="hover:text-blue-400 transition-colors">
                  Queue Controller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/display" className="hover:text-blue-400 transition-colors">
                  Public Waiting Room Screen
                </Link>
              </li>
              <li>
                <Link href="/kiosk" className="hover:text-blue-400 transition-colors">
                  Touchscreen Kiosk Terminal
                </Link>
              </li>
            </ul>
          </div>

          {/* Management & Verification */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Administration
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/admin" className="hover:text-blue-400 transition-colors">
                  Organization & Counters
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics" className="hover:text-blue-400 transition-colors">
                  Queue Analytics & Wait Times
                </Link>
              </li>
              <li>
                <Link href="/admin/audit" className="hover:text-blue-400 transition-colors">
                  Security & Audit Log
                </Link>
              </li>
              <li>
                <Link href="/scan" className="hover:text-blue-400 transition-colors">
                  Staff QR Check-in Terminal
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Security */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Enterprise Reliability
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>PostgreSQL Concurrency Locks</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>3-Stage Smart Turn Approach</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                <span>Automated Congestion Alerting</span>
              </div>
              <p className="pt-2 text-[11px] text-slate-500">
                Non-guessable reference codes &bull; Zero client-side arithmetic drift
              </p>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 text-center sm:flex sm:justify-between text-xs text-slate-500">
          <p>&copy; 2026 Q-Sync. Your turn. Without the wait.</p>
          <p className="mt-2 sm:mt-0">Designed for mission-critical clinic & enterprise deployments.</p>
        </div>
      </div>
    </footer>
  );
}
