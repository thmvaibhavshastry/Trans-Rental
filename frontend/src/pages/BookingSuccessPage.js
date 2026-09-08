import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Car, IndianRupee, LayoutDashboard } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Loading, ErrorState } from '../components/States';
import { bookingService } from '../services/bookingService';
import { formatCurrency, formatDateTime, getStatusColor, getErrorMessage } from '../utils/helpers';

export default function BookingSuccessPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingService.getBooking(bookingId)
      .then((res) => { setBooking(res.data); setLoading(false); })
      .catch((err) => { setError(getErrorMessage(err)); setLoading(false); });
  }, [bookingId]);

  if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><Loading text="Loading booking..." /></div>;
  if (error) return <div className="min-h-screen bg-slate-50"><Navbar /><ErrorState message={error} /></div>;
  if (!booking) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success Card */}
        <div className="card p-8 text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-5">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-500 mb-4">Your vehicle has been booked successfully. Have a great trip!</p>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
            <span className="text-xs font-medium text-green-700">Booking ID:</span>
            <span className="font-bold text-green-800">#{String(booking.id).padStart(6, '0')}</span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-4">Booking Details</h2>
          <div className="space-y-4">
            {/* Vehicle */}
            <div className="flex gap-4 pb-4 border-b border-slate-100">
              <img
                src={booking.vehicle?.image_display || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'}
                alt={booking.vehicle?.name}
                className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'; }}
              />
              <div>
                <p className="font-bold text-slate-900">{booking.vehicle?.name}</p>
                <p className="text-sm text-slate-500">{booking.vehicle?.brand} · {booking.vehicle?.model}</p>
                <p className="text-xs text-primary-600 font-medium">{booking.vehicle?.category?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Pickup Location</p>
                  <p className="font-medium text-slate-800">{booking.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="font-medium text-slate-800">{booking.number_of_days} day{booking.number_of_days !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pickup Date & Time</p>
                <p className="font-medium text-slate-800">{formatDateTime(booking.pickup_datetime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Return Date & Time</p>
                <p className="font-medium text-slate-800">{formatDateTime(booking.return_datetime)}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Rental Amount</span>
                <span>{formatCurrency(booking.rental_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span>{formatCurrency(booking.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-primary-600 text-base">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Status</span>
              <span className={`badge ${getStatusColor(booking.status)}`}>{booking.status}</span>
            </div>
            
            {/* Payment Details */}
            {booking.payment && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-900">{booking.payment.method === 'ONLINE' ? 'Razorpay' : 'Pay at Pickup'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Payment Status</span>
                  <span className={`badge ${booking.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {booking.payment.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link to={`/dashboard`} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <LayoutDashboard className="h-4 w-4" /> View Dashboard
          </Link>
          <Link to="/search" className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Car className="h-4 w-4" /> Book Another
          </Link>
        </div>
      </div>
    </div>
  );
}
