import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { MenuItem, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: MenuItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalItemCount: number;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'foodie_cart_items_v1';
const STANDARD_DELIVERY_FEE = 40; // ₹40

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item: any) =>
              item &&
              item.product &&
              typeof item.product.id === 'string' &&
              typeof item.product.price === 'number' &&
              typeof item.quantity === 'number' &&
              item.quantity > 0
          );
        }
      }
    } catch (e) {
      console.error('Failed to parse cart items from localStorage:', e);
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Synchronize cart with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  const addToCart = (product: MenuItem) => {
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 50) }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const cappedQuantity = Math.min(Math.max(1, Math.floor(quantity)), 50);

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: cappedQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (productId: string): number => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Centralized calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [items]);

  const deliveryFee = useMemo(() => {
    return items.length > 0 ? STANDARD_DELIVERY_FEE : 0;
  }, [items]);

  const total = useMemo(() => {
    return subtotal + deliveryFee;
  }, [subtotal, deliveryFee]);

  const totalItemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        deliveryFee,
        total,
        totalItemCount,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
