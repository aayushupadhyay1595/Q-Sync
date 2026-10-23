'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';

interface QrCodeDisplayProps {
  refCode: string;
  displayNumber: string;
  size?: number;
}

export function QrCodeDisplay({ refCode, displayNumber, size = 180 }: QrCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://q-sync.io';
    const verifyUrl = `${origin}/track/${refCode}`;

    QRCode.toDataURL(verifyUrl, {
      width: size * 2, // 2x density for crisp rendering
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => setDataUrl(url)).catch(err => console.error(err));
  }, [refCode, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qsync-ticket-${displayNumber}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-md border border-slate-200">
      {dataUrl ? (
        <img 
          src={dataUrl} 
          alt={`QR Ticket for ${displayNumber}`} 
          className="rounded-lg shadow-sm"
          style={{ width: size, height: size }}
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-slate-100 rounded-lg text-slate-400"
          style={{ width: size, height: size }}
        >
          <QrCode className="w-8 h-8 animate-pulse text-slate-400" />
        </div>
      )}
      <div className="mt-2 text-center">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-600 block">
          {refCode}
        </span>
        <button
          onClick={handleDownload}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Save Ticket QR
        </button>
      </div>
    </div>
  );
}
