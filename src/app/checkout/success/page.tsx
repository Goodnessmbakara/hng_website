'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail, ArrowRight, ShieldCheck, ShoppingBag, Terminal } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'TH-UNKNOWN';
  const email = searchParams.get('email') || 'customer@example.com';
  const name = searchParams.get('name') || 'Valued Customer';
  const total = searchParams.get('total') || '0.00';
  const emailStatus = searchParams.get('emailStatus') || 'simulated';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-center">
        
        {/* Animated Checkmark */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mb-6 shadow-inner">
          <CheckCircle2 className="h-10 w-10 animate-in zoom-in-75 duration-300" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-4">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Payment & Order Confirmed</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto">
          Hey {name}, your order has been received and saved to the database. We're getting your tech gear ready.
        </p>

        {/* Order Details Badge */}
        <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-100 dark:border-slate-800 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Order Reference</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              #{orderNumber}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Total Charged</span>
            <span className="font-bold text-blue-600 text-sm">
              ${parseFloat(total).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Confirmation Sent To</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {email}
            </span>
          </div>
        </div>

        {/* Mailgun Delivery Status Card */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/30 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white flex-shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Mailgun Email Dispatch
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  emailStatus === 'sent'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : emailStatus === 'failed'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                }`}>
                  {emailStatus === 'sent'
                    ? 'LIVE DELIVERED'
                    : emailStatus === 'failed'
                    ? 'MAILGUN NOTIFICATION'
                    : 'SIMULATED'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {emailStatus === 'sent' ? (
                  <>
                    A branded HTML receipt and order summary has been delivered via <strong>Mailgun API</strong> to <strong>{email}</strong>.
                  </>
                ) : emailStatus === 'failed' ? (
                  <>
                    Order successfully persisted in <strong>Neon PostgreSQL</strong>. Note: Mailgun Sandbox domains only allow outbound emails to <em>Authorized Recipients</em>. To receive live emails at <strong>{email}</strong>, add this address under <strong>Mailgun Dashboard → Sending → Domains → Authorized Recipients</strong>.
                  </>
                ) : (
                  <>
                    Order confirmation generated and logged. To trigger live outbound delivery to real inboxes, configure your <code>MAILGUN_API_KEY</code> and <code>MAILGUN_DOMAIN</code> in <code>.env.local</code>.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            Back to Store Catalog
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-sm font-semibold text-slate-500">Loading order confirmation...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
