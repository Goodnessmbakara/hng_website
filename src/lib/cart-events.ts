import { EventEmitter } from 'events';
import { CartItem } from './types';

// Use global singleton to preserve listeners across Next.js API route invocations in development
const globalForCart = global as unknown as { cartEventEmitter?: EventEmitter };

export const cartEventEmitter = globalForCart.cartEventEmitter || new EventEmitter();
cartEventEmitter.setMaxListeners(100);

globalForCart.cartEventEmitter = cartEventEmitter;

export function broadcastCartUpdate(userId: string, items: CartItem[]) {
  cartEventEmitter.emit(`cart:${userId}`, items);
}

export function onCartUpdate(userId: string, listener: (items: CartItem[]) => void) {
  const eventName = `cart:${userId}`;
  cartEventEmitter.on(eventName, listener);
  return () => {
    cartEventEmitter.off(eventName, listener);
  };
}
