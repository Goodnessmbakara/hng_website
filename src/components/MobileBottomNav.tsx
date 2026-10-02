'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Store, ShoppingBag, Package, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { totalItems, toggleCart } = useCart();

  const isStore = pathname === '/';
  const isOrders = pathname === '/orders';
  const isCheckout = pathname === '/checkout';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] transition-transform">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Store */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
            isStore ? 'text-blue-600 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Store className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Store</span>
        </Link>

        {/* Live Cart Trigger */}
        <button
          onClick={toggleCart}
          className="relative flex flex-col items-center justify-center min-w-[56px] py-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
          aria-label="Open Shopping Cart"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5 mb-0.5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-950">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </button>

        {/* Orders */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
            isOrders ? 'text-blue-600 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Package className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Orders</span>
        </Link>

        {/* Account / Checkout */}
        <Link
          href="/checkout"
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors ${
            isCheckout ? 'text-blue-600 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <User className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">{session?.user ? 'Account' : 'Checkout'}</span>
        </Link>
      </div>
    </div>
  );
}
