'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { INITIAL_PRODUCTS, CATEGORIES } from '@/lib/products-data';
import { Product } from '@/lib/types';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Laptop, Headphones, Watch, Filter } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  // Fetch live products from Neon PostgreSQL
  React.useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.log('Using initial products cache:', err));
  }, []);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <>
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-12 sm:py-24">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/15 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4 sm:mb-6">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Next-Gen Tech & Accessories Available</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-6xl text-white leading-tight">
                Engineered for <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                  Peak Performance.
                </span>
              </h1>

              <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Experience ultra-fast computing, reference-grade studio acoustics, and precision mechanical peripherals built for developers, creators, and enthusiasts.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href="#catalog"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 sm:py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 active:scale-95 transition-all text-center"
                >
                  Explore Store Catalog
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 sm:py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all text-center"
                >
                  Go to Checkout
                </Link>
              </div>

              {/* Highlights */}
              <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-800/80 pt-6 sm:pt-8 max-w-xl text-center sm:text-left">
                <div>
                  <div className="font-extrabold text-white text-base sm:text-xl">45h+</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Battery Life</div>
                </div>
                <div>
                  <div className="font-extrabold text-white text-base sm:text-xl">100%</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Authentic</div>
                </div>
                <div>
                  <div className="font-extrabold text-white text-base sm:text-xl">Instant</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Confirmation</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Section */}
        <section id="catalog" className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          {/* Section Header & Category Pills */}
          <div className="flex flex-col gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Featured Gear
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            {/* Category Filter Pills - Touch horizontal scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar touch-scroll">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold transition-all active:scale-95 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid - 2 columns on mobile, 4 columns on large desktop */}
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Filter className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                No gadgets found
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Try resetting your search query or switching categories.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500 active:scale-95"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setActiveModalProduct(p)}
                />
              ))}
            </div>
          )}

        </section>
      </main>


      {/* Quick View Product Modal */}
      <ProductModal
        product={activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
      />
    </>
  );
}
