import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, Car, Bike, Tractor, Truck, Bus, Settings } from 'lucide-react';
import { LOCATIONS, toDatetimeLocal } from '../utils/helpers';
import { useCategories } from '../hooks/useCategories';
import CustomDropdown from './CustomDropdown';
import RentalDateTimePicker from './RentalDateTimePicker';

const ICON_MAP = {
  Car: <Car className="w-4 h-4" />,
  Bike: <Bike className="w-4 h-4" />,
  Tractor: <Tractor className="w-4 h-4" />,
  Truck: <Truck className="w-4 h-4" />,
  Bus: <Bus className="w-4 h-4" />,
};

/** Return ISO string for "today at HH:MM" local time */
function localNow() {
  return toDatetimeLocal(new Date());
}

/** Return ISO string for "tomorrow at same HH:MM" */
function localTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDatetimeLocal(d);
}

export default function SearchBox({ initialValues = {}, compact = false }) {
  const navigate = useNavigate();
  const { categories, loading } = useCategories();

  const [form, setForm] = useState({
    category: initialValues.category || 'CAR',
    location: initialValues.location || 'Bangalore',
    pickup_datetime: initialValues.pickup_datetime || localNow(),
    return_datetime: initialValues.return_datetime || localTomorrow(),
  });

  const categoryOptions = [
    { label: 'All Categories', value: 'ALL', icon: <Car className="w-4 h-4" /> },
    ...Object.entries(categories).map(([k, v]) => ({
      label: v.label,
      value: k,
      icon: ICON_MAP[v.icon] || <Settings className="w-4 h-4" />,
    })),
  ];

  const locationOptions = [
    { label: 'All Cities', value: 'ALL', icon: <MapPin className="w-4 h-4" /> },
    ...LOCATIONS.map((l) => ({
      label: l,
      value: l,
      icon: <MapPin className="w-4 h-4" />,
    })),
  ];

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.category) params.set('category', form.category);
    if (form.location) params.set('location', form.location);
    if (form.pickup_datetime) params.set('pickup_datetime', form.pickup_datetime);
    if (form.return_datetime) params.set('return_datetime', form.return_datetime);
    navigate(`/search?${params.toString()}`);
  };

  // Min value for return: must be after pickup
  const returnMin = form.pickup_datetime || localNow();

  return (
    <form onSubmit={handleSearch} className={`bg-white rounded-2xl shadow-xl ${compact ? 'p-3' : 'p-4 md:p-5'} w-full ring-1 ring-slate-100`}>
      <div className={`grid gap-3 md:gap-4 ${compact ? 'grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_1.4fr_auto]' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_1.4fr_auto]'} items-center`}>
        {/* Category */}
        <div className="flex flex-col justify-center relative border border-slate-200 rounded-xl p-3 hover:border-primary-500 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600 focus-within:bg-white transition-all bg-slate-50 h-[72px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
            Category
          </label>
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <CustomDropdown
              value={form.category}
              onChange={(val) => setForm((p) => ({ ...p, category: val }))}
              options={categoryOptions}
              placeholder={loading ? 'Loading...' : 'Select Category'}
              disabled={loading || Object.keys(categories).length === 0}
            />
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col justify-center relative border border-slate-200 rounded-xl p-3 hover:border-primary-500 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600 focus-within:bg-white transition-all bg-slate-50 h-[72px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
            Pickup Location
          </label>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <CustomDropdown
              value={form.location}
              onChange={(val) => setForm((p) => ({ ...p, location: val }))}
              options={locationOptions}
              placeholder="Select City"
            />
          </div>
        </div>

        {/* Pickup Date+Time */}
        <RentalDateTimePicker
          label="Pickup Date"
          type="pickup"
          value={form.pickup_datetime}
          min={localNow()}
          onChange={(val) => handleChange({ target: { name: 'pickup_datetime', value: val } })}
        />

        {/* Return Date+Time */}
        <RentalDateTimePicker
          label="Return Date"
          type="return"
          value={form.return_datetime}
          min={form.pickup_datetime || localNow()}
          onChange={(val) => handleChange({ target: { name: 'return_datetime', value: val } })}
        />

        {/* Search Button — full row on mobile, auto-span */}
        <button
          type="submit"
          className="h-[72px] min-w-[190px] bg-primary-600 hover:bg-primary-500 text-white font-bold text-[15px] rounded-xl transition-all shadow-[0_4px_14px_0_rgba(13,148,136,0.39)] hover:shadow-[0_6px_20px_rgba(13,148,136,0.23)] hover:-translate-y-0.5 flex items-center justify-center gap-2.5 active:bg-primary-700 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 lg:col-span-1 col-span-2 whitespace-nowrap px-6 flex-shrink-0"
        >
          <Search className="h-5 w-5" />
          <span>{compact ? 'Search' : 'Search Vehicles'}</span>
        </button>
      </div>
    </form>
  );
}
