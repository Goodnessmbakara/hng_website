'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 150;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Your Cart ({totalItems})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 sm:px-6 sm:py-3">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-700 dark:text-slate-300">
                {isFreeShipping
                  ? '🎉 Free express shipping unlocked!'
                  : `Add $${(freeShippingThreshold - subtotal).toFixed(2)} more for Free Shipping`}
              </span>
              <span className="text-blue-600">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4 touch-scroll overscroll-contain">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Your cart is empty
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Discover our top-rated tech gear and accessories to populate your bag.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Explore Tech Store
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4 last:border-b-0"
                >
                  <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 pr-1">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{product.category}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1.5 sm:p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-l-lg text-slate-600 dark:text-slate-300 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900 dark:text-white min-w-[20px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="p-1.5 sm:p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-r-lg text-slate-600 dark:text-slate-300 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-3 sm:space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">
                    {isFreeShipping ? 'FREE' : '$9.99'}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Estimated Total</span>
                  <span className="text-blue-600 text-base sm:text-lg">
                    ${(subtotal + (isFreeShipping ? 0 : 9.99)).toFixed(2)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
