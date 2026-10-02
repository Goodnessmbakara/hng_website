import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Product, CartItem } from '../types';
import { useAuth } from './AuthContext';
import { apiRequest } from '../api/client';
import { getApiUrl } from '../config';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  lastSyncedAt: Date | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const userId = user?.id || user?.email || null;

  // 1. Fetch cart from backend with concurrency guard & cancellation
  const fetchCart = useCallback(async (signal?: AbortSignal) => {
    if (!userId) {
      if (isMountedRef.current) setItems([]);
      return;
    }

    if (isFetchingRef.current) {
      return; // Skip overlapping poll
    }

    isFetchingRef.current = true;
    try {
      const res = await apiRequest<{ success: boolean; items: CartItem[] }>(
        `/api/cart?userId=${encodeURIComponent(userId)}`,
        { signal }
      );

      if (res.success && Array.isArray(res.data?.items)) {
        if (isMountedRef.current) {
          setItems(res.data.items);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Failed to fetch cart on mobile:', err);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [userId]);

  // 2. Fetch on user change
  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();

    if (userId) {
      setIsLoading(true);
      fetchCart(controller.signal).finally(() => {
        if (isMountedRef.current) setIsLoading(false);
      });
    } else {
      setItems([]);
    }

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, [userId, fetchCart]);

  // 3. Instant Real-time Synchronization Loop
  // Polls the server every 2 seconds when logged in, ensuring changes made on the web
  // appear almost instantaneously on the physical phone screen!
  useEffect(() => {
    if (!userId) return;

    let isPollingActive = true;
    const pollController = new AbortController();

    const interval = setInterval(() => {
      if (isPollingActive) {
        fetchCart(pollController.signal);
      }
    }, 2000);

    return () => {
      isPollingActive = false;
      pollController.abort();
      clearInterval(interval);
    };
  }, [userId, fetchCart]);

  // 4. Cart actions with optimistic updates
  const addToCart = async (product: Product, quantity = 1) => {
    if (!userId) return;

    // Optimistic local update
    setItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id
            ? { ...it, quantity: it.quantity + quantity }
            : it
        );
      }
      return [...prev, { product, quantity }];
    });

    try {
      const res = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          productId: product.id,
          quantity,
          action: 'add',
        }),
      });

      if (res.success && Array.isArray(res.data?.items)) {
        if (isMountedRef.current) {
          setItems(res.data.items);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.error('Failed to add to cart on server:', err);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!userId) return;

    setItems((prev) => prev.filter((it) => it.product.id !== productId));

    try {
      const res = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          productId,
          action: 'remove',
        }),
      });

      if (res.success && Array.isArray(res.data?.items)) {
        if (isMountedRef.current) {
          setItems(res.data.items);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.error('Failed to remove from cart on server:', err);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!userId) return;

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    setItems((prev) =>
      prev.map((it) =>
        it.product.id === productId ? { ...it, quantity } : it
      )
    );

    try {
      const res = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          productId,
          quantity,
          action: 'update',
        }),
      });

      if (res.success && Array.isArray(res.data?.items)) {
        if (isMountedRef.current) {
          setItems(res.data.items);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.error('Failed to update cart quantity on server:', err);
    }
  };

  const clearCart = async () => {
    if (!userId) return;

    setItems([]);

    try {
      await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          action: 'clear',
        }),
      });
      if (isMountedRef.current) {
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to clear cart on server:', err);
    }
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
        isLoading,
        refreshCart: fetchCart,
        lastSyncedAt,
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
