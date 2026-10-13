import React from 'react';
import { Pizza, Beef, UtensilsCrossed, CupSoda, LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Items', icon: LayoutGrid },
  { id: 'pizzas', label: 'Pizzas', icon: Pizza },
  { id: 'burgers', label: 'Burgers', icon: Beef },
  { id: 'sides', label: 'Sides', icon: UtensilsCrossed },
  { id: 'beverages', label: 'Beverages', icon: CupSoda },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-102'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
