'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Product, CartItem } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'techhaven_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const userId = session?.user?.id || session?.user?.email || null;

  // 1. Initial load: Load from localStorage first for instantaneous UI
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from storage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Persist local cache
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage:', e);
    }
  }, [items, isHydrated]);

  // 3. Realtime Server-Sent Events (SSE) listener when authenticated
  useEffect(() => {
    let isSubscribed = true;
    const abortController = new AbortController();

    if (!userId) {
      if (sseRef.current) {
        sseRef.current.onmessage = null;
        sseRef.current.onerror = null;
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }

    // Initial fetch from backend with abort signal
    const fetchBackendCart = async () => {
      try {
        if (isSubscribed) setIsSyncing(true);
        const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
          signal: abortController.signal,
        });
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            setItems(data.items);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch backend cart:', err);
        }
      } finally {
        if (isSubscribed) setIsSyncing(false);
      }
    };

    fetchBackendCart();

    // Connect to SSE stream for instant updates from other devices (e.g. mobile app)
    const streamUrl = `/api/cart/stream?userId=${encodeURIComponent(userId)}`;
    const eventSource = new EventSource(streamUrl);
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (!isSubscribed) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'cart_updated' || payload.type === 'cart_sync') {
          if (Array.isArray(payload.items)) {
            setItems(payload.items);
          }
        }
      } catch {
        // Ping or non-JSON data
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically attempts to reconnect on disconnect
    };

    return () => {
      isSubscribed = false;
      abortController.abort();
      eventSource.onmessage = null;
      eventSource.onerror = null;
      eventSource.close();
      if (sseRef.current === eventSource) {
        sseRef.current = null;
      }
    };
  }, [userId]);

  // Synchronize mutation to backend
  const syncMutation = useCallback(
    async (payload: { productId?: string; quantity?: number; action: string }) => {
      if (!userId) return;
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
          signal: AbortSignal.timeout(8000),
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to sync cart mutation to backend:', err);
        }
      }
    },
    [userId]
  );


  const addToCart = (product: Product, quantity = 1) => {
    // 1. Optimistic update
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);

    // 2. Sync to server
    syncMutation({ productId: product.id, quantity, action: 'add' });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
    syncMutation({ productId, action: 'remove' });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    syncMutation({ productId, quantity, action: 'update' });
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    syncMutation({ action: 'clear' });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((prev) => !prev),
        isSyncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
