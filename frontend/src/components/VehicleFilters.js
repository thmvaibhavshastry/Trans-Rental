import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';

export default function VehicleFilters({ filters, onChange, onReset }) {
  const { categories } = useCategories();
  
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCategory = filters.category || 'CAR';
  const specs = categories[activeCategory]?.specs || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary-600" />
          <h3 className="font-bold text-slate-900">Filters</h3>
        </div>
        <button onClick={onReset} className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 uppercase tracking-wider">
          <X className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Category */}
      <div className="mb-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Category</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(categories).length === 0 ? <p className="text-xs text-red-500">Error loading categories</p> : Object.entries(categories).map(([k, v]) => (
            <button key={k}
              onClick={() => handleChange('category', k)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                filters.category === k
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primary-400 hover:bg-white'
              }`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6 border-t border-slate-100 pt-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Max Price: ₹{filters.max_price || 10000}/day
        </p>
        <input type="range" min="500" max="20000" step="500"
          value={filters.max_price || 10000}
          onChange={(e) => handleChange('max_price', e.target.value)}
          className="w-full accent-primary-600" />
        <div className="flex justify-between text-xs font-bold text-slate-400 mt-1">
          <span>₹500</span><span>₹20,000+</span>
        </div>
      </div>

      {/* Dynamic Spec Filters based on Category */}
      {specs.filter(s => s.type === 'select').map(spec => (
        <div key={spec.name} className="mb-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{spec.label}</p>
          <div className="flex flex-wrap gap-2">
            {spec.options.map(opt => (
              <button key={opt}
                onClick={() => handleChange(spec.name, filters[spec.name] === opt ? '' : opt)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  filters[spec.name] === opt
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primary-400 hover:bg-white'
                }`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
