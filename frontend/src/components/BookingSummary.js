import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { formatCurrency, formatDateTime, calcDays } from '../utils/helpers';

export default function BookingSummary({ vehicle, pickupDatetime, returnDatetime, pickupLocation }) {
  const days = calcDays(pickupDatetime, returnDatetime);
  const rental = vehicle ? parseFloat(vehicle.price_per_day) * days : 0;
  const tax = rental * 0.18;
  const total = rental + tax;

  return (
    <div className="card p-5 sticky top-24">
      <h3 className="font-bold text-gray-900 mb-4 text-lg">Booking Summary</h3>

      {vehicle && (
        <div className="flex gap-3 mb-4 pb-4 border-b border-gray-100">
          <img
            src={vehicle.image_display || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'}
            alt={vehicle.name}
            className="w-20 h-14 object-cover rounded-lg"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'; }}
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{vehicle.name}</p>
            <p className="text-xs text-gray-500">{vehicle.brand} · {vehicle.model}</p>
            <p className="text-xs text-blue-600 font-medium mt-0.5">{formatCurrency(vehicle.price_per_day)}/day</p>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4 text-sm">
        {pickupLocation && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Pickup Location</p>
              <p className="font-medium text-gray-800">{pickupLocation}</p>
            </div>
          </div>
        )}
        {pickupDatetime && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="font-medium text-gray-800">{formatDateTime(pickupDatetime)}</p>
            </div>
          </div>
        )}
        {returnDatetime && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Return</p>
              <p className="font-medium text-gray-800">{formatDateTime(returnDatetime)}</p>
            </div>
          </div>
        )}
      </div>

      {days > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{formatCurrency(vehicle?.price_per_day)}/day × {days} day{days !== 1 ? 's' : ''}</span>
            <span>{formatCurrency(rental)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST (18%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-base">
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
          {days > 1 && (
            <p className="text-xs text-gray-400 text-center pt-1">
              Billing: {days} day{days !== 1 ? 's' : ''} (any started 24-hour block counts as 1 day)
            </p>
          )}
        </div>
      )}

      {days === 0 && (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
          Select pickup &amp; return time to see pricing
        </div>
      )}
    </div>
  );
}
