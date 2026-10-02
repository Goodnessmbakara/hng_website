'use client';

import React from 'react';
import Image from 'next/image';
import { Star, ShoppingBag, Eye, Check } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart, items } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const cartItem = items.find((i) => i.product.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 cursor-pointer active:scale-[0.98]"
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1 max-w-[80%]">
          {product.badge && (
            <span className="rounded-full bg-blue-600/95 backdrop-blur-sm px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-sm truncate">
              {product.badge}
            </span>
          )}
          <span className="rounded-full bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-white truncate">
            {product.category}
          </span>
        </div>

        {/* Quick View Button - Always visible on mobile touch, hover on desktop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute right-2 top-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm opacity-90 sm:opacity-0 group-hover:opacity-100 hover:bg-white hover:text-blue-600 transition-all dark:bg-slate-900/90 dark:text-slate-200"
          title="Quick preview"
          aria-label="Quick preview"
        >
          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        {/* Rating */}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-500 mb-1">
          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{product.rating}</span>
          <span className="text-slate-400">({product.reviewsCount})</span>
        </div>

        {/* Title */}
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Description snippet - hidden on mobile 2-col to keep cards sleek */}
        <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 mt-1 mb-3 flex-1">
          {product.description}
        </p>

        {/* Price and Add button */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100 dark:border-slate-800 gap-1.5">
          <div>
            <span className="hidden sm:block text-[10px] text-slate-400">Price</span>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              ${product.price.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold shadow-sm transition-all active:scale-95 ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{cartItem ? `(${cartItem.quantity})` : 'Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
