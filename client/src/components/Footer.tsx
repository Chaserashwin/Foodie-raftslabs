import React from 'react';
import { Utensils, Heart, Shield, Clock, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* Service Highlights */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-brand-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Lightning Fast</h4>
                <p className="text-xs text-slate-400">Fresh and piping hot delivered in under 30 mins</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-brand-400 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Live Order Tracking</h4>
                <p className="text-xs text-slate-400">Track every step from the kitchen to your doorstep</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-brand-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Uncompromising Quality</h4>
                <p className="text-xs text-slate-400">100% gourmet ingredients prepared by certified chefs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white">
                Foodie<span className="text-brand-500">.</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm mb-4 leading-relaxed">
              Order artisanal pizzas, gourmet smash burgers, crunchy sides, and crafted beverages with live kitchen status updates.
            </p>
            <p className="text-xs text-slate-500">
              Built for RaftLabs Senior Full Stack Developer Assessment.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Navigation</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-400 transition-colors">
                  Menu Catalog
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-brand-400 transition-colors">
                  Track Delivery
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-brand-400 transition-colors">
                  Kitchen Portal (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Categories</h5>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Artisanal Pizzas</li>
              <li>Gourmet Smash Burgers</li>
              <li>Sides & Fries</li>
              <li>Crafted Cold Beverages</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Foodie Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> for RaftLabs
          </p>
        </div>
      </div>
    </footer>
  );
};
