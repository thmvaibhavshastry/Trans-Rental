import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Truck, Car, Bike, Tractor, Bus } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const ICON_MAP = { Car, Bike, Tractor, Truck, Bus };

export default function VehicleCard({ vehicle, pickupDatetime, returnDatetime }) {
  const {
    id, name, category, image_display, price_per_day,
    location, rating, reviews_count, status, specifications
  } = vehicle;

  // Safe parse specs if it's a string from old migrations
  const specs = typeof specifications === 'string' ? JSON.parse(specifications || '{}') : (specifications || {});
  
  // Extract top 3 specs values to show on card
  const specValues = Object.values(specs).filter(v => v).slice(0, 3);
  
  // Choose an icon based on category
  const CategoryIcon = ICON_MAP[
    category === 'CAR' ? 'Car' :
    category === 'BIKE' ? 'Bike' :
    category === 'JCB' || category === 'TRACTOR' ? 'Tractor' :
    category === 'TRUCK' || category === 'MINI_TRUCK' || category === 'TEMPO' ? 'Truck' :
    category === 'BUS' || category === 'VAN' ? 'Bus' :
    'Car'
  ];

  // Build detail link — optionally with datetime params for pre-fill on booking page
  const detailParams = new URLSearchParams();
  if (pickupDatetime) detailParams.set('pickup_datetime', pickupDatetime);
  if (returnDatetime) detailParams.set('return_datetime', returnDatetime);
  const detailHref = `/vehicles/${id}${detailParams.toString() ? '?' + detailParams.toString() : ''}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden h-52 bg-slate-100">
        <img
          src={image_display || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'; }}
        />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm ${
            status === 'AVAILABLE' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-white'
          }`}>
            {status}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Category & Location */}
        <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 gap-1.5 truncate">
          <CategoryIcon className="h-3.5 w-3.5" />
          <span>{category.replace('_', ' ')}</span>
          <span className="text-slate-300">•</span>
          <MapPin className="h-3 w-3" />
          <span className="truncate">{location}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate mb-1" title={name}>{name}</h3>
        
        {/* Specs */}
        <div className="text-sm font-medium text-slate-600 mb-3 truncate h-5">
          {specValues.length > 0 ? specValues.join(' • ') : <span className="text-slate-400 italic">Standard</span>}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-5">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-slate-800">{rating > 0 ? rating : 'New'}</span>
          <span className="text-xs font-medium text-slate-500">({reviews_count})</span>
        </div>

        {/* Price & CTA */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <span className="text-xl font-extrabold text-slate-900">{formatCurrency(price_per_day)}</span>
            <span className="text-xs text-slate-500 font-bold tracking-wide">/day</span>
          </div>
          <Link to={detailHref}
            className="bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-700 text-slate-800 font-bold text-sm py-2 px-4 rounded-lg transition-colors shadow-sm">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
