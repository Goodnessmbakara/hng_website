'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Order } from '@/lib/types';
import Header from '@/components/Header';
import { Package, ArrowLeft, Mail, Clock, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      })
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 flex-1">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Order History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live orders persisted in Neon Serverless PostgreSQL.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Package className="h-3.5 w-3.5" />
            <span>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Recorded</span>
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
            <p className="mt-4 text-xs font-semibold text-slate-500">Querying orders from Neon DB...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Orders Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Place an order from the shop and it will be immediately saved to Neon PostgreSQL.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-500 transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Header */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Order Number</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      #{order.orderNumber}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Placed On</span>
                    <div className="text-slate-700 dark:text-slate-200 font-semibold">
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Recipient</span>
                    <div className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-[160px]">
                      {order.customerName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Total Amount</span>
                    <div className="font-extrabold text-blue-600 text-sm">
                      ${order.total.toFixed(2)}
                    </div>
                  </div>

                  {/* Mailgun Status Badge */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Mailgun Status</span>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          order.mailgunStatus === 'sent'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : order.mailgunStatus === 'failed'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <Mail className="h-3 w-3" />
                        {order.mailgunStatus === 'sent'
                          ? 'Email Delivered'
                          : order.mailgunStatus === 'failed'
                          ? 'Sandbox / Failed'
                          : 'Simulated'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      {item.imageUrl && (
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {item.productName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        ${item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
