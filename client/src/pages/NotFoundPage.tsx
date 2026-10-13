import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-3xl bg-orange-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
        <Utensils className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900">Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
        The page or recipe you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Menu</span>
      </Link>
    </div>
  );
};
