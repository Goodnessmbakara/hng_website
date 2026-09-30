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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {product.badge && (
            <span className="rounded-full bg-blue-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {product.badge}
            </span>
          )}
          <span className="rounded-full bg-slate-900/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-white">
            {product.category}
          </span>
        </div>

        {/* Quick View Button overlay on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-white hover:text-blue-600 transition-all dark:bg-slate-900/90 dark:text-slate-200"
          title="Quick preview"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col pt-4">
        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-amber-500 mb-1">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{product.rating}</span>
          <span className="text-slate-400">({product.reviewsCount})</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-4 flex-1">
          {product.description}
        </p>

        {/* Price and Add button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400">Price</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              ${product.price.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all active:scale-95 ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{cartItem ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
