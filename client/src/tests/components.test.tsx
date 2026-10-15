import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { OrderTimeline } from '../components/OrderTimeline';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { validateCustomerForm } from '../utils/validators';
import { CartProvider } from '../context/CartContext';
import { MenuItem, OrderTimelineItem } from '../types';

const mockItem: MenuItem = {
  id: 'prod-101',
  name: 'Truffle Mushroom Pizza',
  description: 'Wild forest button mushrooms and black truffle oil',
  price: 469,
  category: 'pizzas',
  imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
  isAvailable: true,
  rating: 4.7,
  prepTime: '20-25 min',
  isVeg: true,
};

describe('Frontend Components Test Suite', () => {
  describe('ProductCard Component', () => {
    it('renders product name, price, veg tag, rating and prep time', () => {
      render(
        <CartProvider>
          <ProductCard product={mockItem} />
        </CartProvider>
      );

      expect(screen.getByText('Truffle Mushroom Pizza')).toBeInTheDocument();
      expect(screen.getByText('VEG')).toBeInTheDocument();
      expect(screen.getByText('4.7')).toBeInTheDocument();
      expect(screen.getByText('20-25 min')).toBeInTheDocument();
      expect(screen.getByText(/469/)).toBeInTheDocument();
    });

    it('toggles quantity controls when added to cart', () => {
      render(
        <CartProvider>
          <ProductCard product={mockItem} />
        </CartProvider>
      );

      const addButton = screen.getByRole('button', { name: /ADD/i });
      fireEvent.click(addButton);

      // Now quantity should show 1
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
    });
  });

  describe('CategoryFilter Component', () => {
    it('renders all category buttons and triggers callback on click', () => {
      const onSelect = vi.fn();
      render(<CategoryFilter selectedCategory="all" onSelectCategory={onSelect} />);

      expect(screen.getByText('All Items')).toBeInTheDocument();
      expect(screen.getByText('Pizzas')).toBeInTheDocument();
      expect(screen.getByText('Burgers')).toBeInTheDocument();
      expect(screen.getByText('Sides')).toBeInTheDocument();
      expect(screen.getByText('Beverages')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Burgers'));
      expect(onSelect).toHaveBeenCalledWith('burgers');
    });
  });

  describe('OrderTimeline Component', () => {
    it('renders all order stages and highlights current stage', () => {
      const timeline: OrderTimelineItem[] = [
        { status: 'ORDER_RECEIVED', timestamp: new Date().toISOString() },
        { status: 'PREPARING', timestamp: new Date().toISOString() },
      ];

      render(<OrderTimeline currentStatus="PREPARING" timeline={timeline} />);

      expect(screen.getByText('Order Received')).toBeInTheDocument();
      expect(screen.getByText('Preparing')).toBeInTheDocument();
      expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
      expect(screen.getByText('Our gourmet chefs are cooking your fresh meal.')).toBeInTheDocument();
    });
  });

  describe('Loading & Error States', () => {
    it('LoadingSpinner renders message properly', () => {
      render(<LoadingSpinner message="Cooking fresh food..." />);
      expect(screen.getByText('Cooking fresh food...')).toBeInTheDocument();
    });

    it('ErrorMessage renders error and retry button callback', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage title="Network Down" message="Could not connect" onRetry={onRetry} />);

      expect(screen.getByText('Network Down')).toBeInTheDocument();
      expect(screen.getByText('Could not connect')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Customer Form Validation', () => {
    it('validates required fields, name length, Indian phone format, and address length', () => {
      // Empty input
      const emptyResult = validateCustomerForm({ name: '', phone: '', address: '' });
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors.name).toBeDefined();
      expect(emptyResult.errors.phone).toBeDefined();
      expect(emptyResult.errors.address).toBeDefined();

      // Invalid phone format
      const invalidPhone = validateCustomerForm({
        name: 'Rahul',
        phone: '12345',
        address: '123 MG Road, Bengaluru',
      });
      expect(invalidPhone.isValid).toBe(false);
      expect(invalidPhone.errors.phone).toContain('valid 10-digit');

      // Valid Indian phone formats: 10 digits starting with 6-9, or +91 format
      const validCase1 = validateCustomerForm({
        name: 'Rahul Sharma',
        phone: '9876543210',
        address: 'Flat 402, Sunshine Heights, Koramangala, Bengaluru',
      });
      expect(validCase1.isValid).toBe(true);
      expect(Object.keys(validCase1.errors).length).toBe(0);

      const validCase2 = validateCustomerForm({
        name: 'Priya Patel',
        phone: '+91 9876543210',
        address: 'Plot 12, Whitefield Main Road, Bengaluru',
      });
      expect(validCase2.isValid).toBe(true);
    });
  });
});
