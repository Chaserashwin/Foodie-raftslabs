import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Utensils, Search, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';

export const Navbar: React.FC = () => {
  const { totalItemCount, subtotal, setIsCartOpen } = useCart();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                Foodie<span className="text-brand-500">.</span>
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 -mt-1">
                Gourmet Express
              </p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-semibold transition-colors ${
                location.pathname === '/'
                  ? 'text-brand-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Explore Menu
            </Link>
            <Link
              to="/track"
              className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                location.pathname.startsWith('/track')
                  ? 'text-brand-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              Track Order
            </Link>
            <Link
              to="/admin"
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-colors ${
                location.pathname.startsWith('/admin')
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Kitchen Admin
            </Link>
          </nav>

          {/* Right Actions: Cart Button */}
          <div className="flex items-center gap-3">
            <Link
              to="/track"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              aria-label="Track order"
            >
              <Search className="w-5 h-5" />
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="View shopping cart"
              className="relative flex items-center gap-3 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white px-4 py-2.5 rounded-2xl font-bold shadow-md shadow-brand-500/25 transition-all duration-200"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-slate-950 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in-50">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-sm">
                {totalItemCount > 0 ? formatCurrency(subtotal) : 'Cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
