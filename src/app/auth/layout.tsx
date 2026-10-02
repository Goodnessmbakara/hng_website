import React from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Authentication - TechHaven',
  description: 'Sign in, register, or manage your TechHaven account security.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group text-white hover:opacity-95 transition-opacity"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight">
            Tech<span className="text-blue-500">Haven</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur transition-all active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Store</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>256-bit TLS Encrypted & Neon PostgreSQL Protected</span>
        </div>
        <div>
          © {new Date().getFullYear()} TechHaven Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
