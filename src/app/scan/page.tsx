'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  User, 
  RotateCcw 
} from 'lucide-react';
import { dataLayer } from '@/lib/data-layer';
import { Token } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';

export default function QRCheckInPage() {
  const router = useRouter();
  const [manualInput, setManualInput] = useState('');
  const [scannedToken, setScannedToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    // If html5-qrcode is active
    let html5QrCode: any = null;

    if (scannerActive) {
      import('html5-qrcode').then((module) => {
        try {
          html5QrCode = new module.Html5Qrcode('qr-reader-container');
          html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText: string) => {
              // Extract ref code if URL or raw
              handleDecodedText(decodedText);
              html5QrCode.stop().catch(() => {});
              setScannerActive(false);
            },
            () => {}
          ).catch((err: any) => {
            console.warn('Camera scanner start error:', err);
            setError('Camera access not permitted or unavailable. Please use manual reference code lookup.');
            setScannerActive(false);
          });
        } catch (e) {
          console.warn('Scanner init error', e);
        }
      });
    }

    return () => {
      if (html5QrCode) {
        try {
          html5QrCode.stop().catch(() => {});
        } catch {}
      }
    };
  }, [scannerActive]);

  const handleDecodedText = (text: string) => {
    setError(null);
    setCheckInSuccess(false);

    // If text is a full url e.g. https://domain/track/QS-A91B4C
    let code = text.trim();
    if (code.includes('/track/')) {
      code = code.split('/track/')[1];
    }
    // Clean query parameters
    code = code.split('?')[0].toUpperCase();

    const token = dataLayer.getTokenByRef(code) || dataLayer.getTokens().find(t => t.display_number.toUpperCase() === code);
    if (!token) {
      setError(`No valid token found for code "${code}". Please verify physical ticket.`);
      setScannedToken(null);
      return;
    }

    setScannedToken(token);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedText(manualInput);
  };

  const handleConfirmArrival = () => {
    if (!scannedToken) return;

    dataLayer.logAudit({
      actor_name: 'Reception Desk Staff',
      actor_role: 'controller',
      action: 'QR_CHECK_IN',
      target_type: 'token',
      target_id: scannedToken.id,
      description: `Visitor verified in-person at check-in station for token ${scannedToken.display_number}`
    });

    setCheckInSuccess(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Reception Verification Terminal</span>
        </div>
        <h1 className="text-3xl font-black text-white">QR Ticket Scanner &amp; Check-In</h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan the visitor's smartphone QR ticket or enter their non-guessable reference code.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera Scanner Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-center">
        {scannerActive ? (
          <div>
            <div id="qr-reader-container" className="mx-auto rounded-2xl overflow-hidden max-w-sm mb-3"></div>
            <button
              onClick={() => setScannerActive(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Stop Camera
            </button>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Camera className="w-8 h-8" />
            </div>
            <button
              onClick={() => {
                setError(null);
                setScannerActive(true);
              }}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch Device Camera Scanner</span>
            </button>
            <p className="text-[11px] text-slate-500 mt-2">Requires camera permission in browser.</p>
          </div>
        )}

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-500"><span className="bg-slate-900 px-3">or manual lookup</span></div>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type reference (e.g. QS-A91B4C or OPD-025)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Verify
          </button>
        </form>
      </div>

      {/* Verified Ticket Result Card */}
      {scannedToken && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <StatusBadge status={scannedToken.status} />
              <PriorityBadge priority={scannedToken.priority} />
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              Ref: {scannedToken.ref_code}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-blue-400">Verified Token</span>
              <div className="text-4xl font-black font-mono text-white mt-0.5">
                {scannedToken.display_number}
              </div>
              <h3 className="font-bold text-slate-200 text-sm mt-1">{scannedToken.service_name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{scannedToken.department_name}</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Visitor</span>
              <span className="text-sm font-bold text-white block">{scannedToken.customer_name || 'Visitor'}</span>
              <span className="text-xs text-slate-400 font-mono">{scannedToken.customer_phone || 'No phone'}</span>
            </div>
          </div>

          {checkInSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold">Check-in confirmed! Patient logged as physically arrived.</span>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmArrival}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Physical Arrival</span>
              </button>

              <button
                onClick={() => setScannedToken(null)}
                className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
