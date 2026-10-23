'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, 
  Ticket, 
  Search, 
  SlidersHorizontal, 
  Tv, 
  MonitorCheck, 
  ShieldCheck, 
  QrCode, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Menu, 
  X,
  Radio
} from 'lucide-react';
import { audioAnnouncer } from '@/lib/audio';
import { dataLayer } from '@/lib/data-layer';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [synced, setSynced] = useState(true);

  useEffect(() => {
    setIsMuted(audioAnnouncer.getMuted());
    const interval = setInterval(() => {
      setSynced(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    audioAnnouncer.setMuted(nextState);
    if (!nextState) {
      audioAnnouncer.playChime();
    }
  };

  const handleResetData = () => {
    if (confirm('Reset queue state to default sample data?')) {
      dataLayer.resetToDefaultSeed();
      window.location.reload();
    }
  };

  const navLinks = [
    { href: '/get-token', label: 'Get Token', icon: Ticket },
    { href: '/track', label: 'Track Token', icon: Search },
    { href: '/controller', label: 'Controller Desk', icon: SlidersHorizontal },
    { href: '/display', label: 'Public Display', icon: Tv },
    { href: '/kiosk', label: 'Kiosk Mode', icon: MonitorCheck },
    { href: '/admin', label: 'Admin', icon: ShieldCheck },
    { href: '/scan', label: 'QR Scan', icon: QrCode },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  Q-Sync
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SMART QUEUE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Your turn. Without the wait.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Tools & Sync Indicator */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Live Sync Badge */}
            <div 
              title="Real-time queue synchronization active across all devices"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Realtime</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleResetData}
              title="Reset queue and counters to initial seed state"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset Seed</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between px-3">
              <span className="text-xs text-slate-400">Queue State</span>
              <button
                onClick={handleResetData}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
