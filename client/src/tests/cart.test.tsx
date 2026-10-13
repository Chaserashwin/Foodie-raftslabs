import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart } from '../context/CartContext';
import { MenuItem } from '../types';

const mockProductA: MenuItem = {
  id: 'prod-1',
  name: 'Margherita Pizza',
  description: 'Classic pizza with fresh mozzarella',
  price: 349,
  category: 'pizzas',
  imageUrl: 'https://example.com/pizza.jpg',
  isAvailable: true,
  rating: 4.8,
  prepTime: '20 min',
  isVeg: true,
};

const mockProductB: MenuItem = {
  id: 'prod-2',
  name: 'Smash Cheeseburger',
  description: 'Juicy smash burger with cheddar',
  price: 299,
  category: 'burgers',
  imageUrl: 'https://example.com/burger.jpg',
  isAvailable: true,
  rating: 4.9,
  prepTime: '15 min',
  isVeg: false,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('Cart Context & Calculations', () => {
  it('should initialize with empty cart and 0 totals', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.deliveryFee).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.totalItemCount).toBe(0);
  });

  it('should add products to cart and correctly calculate subtotal, delivery fee, and total', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProductA);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].product.name).toBe('Margherita Pizza');
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.subtotal).toBe(349);
    expect(result.current.deliveryFee).toBe(40);
    expect(result.current.total).toBe(389);
    expect(result.current.totalItemCount).toBe(1);

    // Add another quantity of same item
    act(() => {
      result.current.addToCart(mockProductA);
    });

    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.subtotal).toBe(698);
    expect(result.current.total).toBe(738);

    // Add second different product
    act(() => {
      result.current.addToCart(mockProductB);
    });

    expect(result.current.items.length).toBe(2);
    expect(result.current.subtotal).toBe(698 + 299);
    expect(result.current.total).toBe(698 + 299 + 40);
    expect(result.current.totalItemCount).toBe(3);
  });

  it('should update quantity and remove item when quantity reaches 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProductA);
      result.current.updateQuantity(mockProductA.id, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.subtotal).toBe(349 * 5);

    // Decrease quantity to 0 -> should remove item
    act(() => {
      result.current.updateQuantity(mockProductA.id, 0);
    });

    expect(result.current.items.length).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.deliveryFee).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('should remove item via removeFromCart and clear all via clearCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProductA);
      result.current.addToCart(mockProductB);
    });

    expect(result.current.items.length).toBe(2);

    act(() => {
      result.current.removeFromCart(mockProductA.id);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].product.id).toBe(mockProductB.id);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items.length).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('should persist cart in localStorage across re-renders', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(mockProductA);
    });

    const stored = JSON.parse(localStorage.getItem('foodie_cart_items_v1') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].product.id).toBe(mockProductA.id);
  });
});
