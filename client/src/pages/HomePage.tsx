import React, { useState, useEffect } from 'react';
import { Search, Flame, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';
import { api } from '../services/api';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const HomePage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadMenu = async (cat: string, search: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMenu(cat, search);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadMenu(selectedCategory, searchQuery);
    }, 250);

    return () => clearTimeout(handler);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-linear-to-r from-slate-900 via-slate-850 to-orange-950 text-white p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-brand-300 text-xs font-bold px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-brand-400" />
            <span>Chef-Crafted Artisan Delivery</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Crave-Worthy Dishes, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-400 to-amber-300">
              Delivered Fast & Fresh.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Experience hand-tossed sourdough pizzas, juicy smash burgers, and handcrafted refreshers delivered straight to your door with live kitchen tracking.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pizza, burger, sides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Menu Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {selectedCategory === 'all'
                ? 'Popular Menu Items'
                : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {items.length} dishes
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Prepared to order</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner message="Curating available gourmet dishes..." />}

        {/* Error State */}
        {!loading && error && (
          <ErrorMessage
            title="Failed to Load Menu"
            message={error}
            onRetry={() => loadMenu(selectedCategory, searchQuery)}
          />
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No dishes found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              We couldn't find any dishes matching "{searchQuery}". Try searching for something else or view all categories.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
