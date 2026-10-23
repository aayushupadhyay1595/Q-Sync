import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Q-Sync — Smart Queue Management System',
  description: 'Your turn. Without the wait. Digitize physical queues, issue atomic tokens, and notify customers as their turn approaches.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Suspense fallback={<div className="h-16 bg-slate-950 border-b border-slate-800" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
