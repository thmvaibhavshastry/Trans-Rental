import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Calendar, MapPin, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loading, EmptyState, ErrorState } from '../components/States';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime, getStatusColor, getErrorMessage } from '../utils/helpers';

function BookingCard({ booking, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    await onCancel(booking.id);
    setCancelling(false);
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        <img
          src={booking.vehicle?.image_display || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'}
          alt={booking.vehicle?.name}
          className="w-full sm:w-24 h-20 object-cover rounded-xl flex-shrink-0"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <p className="font-bold text-slate-900">{booking.vehicle?.name}</p>
              <p className="text-xs text-slate-400">Booking #{String(booking.id).padStart(6, '0')}</p>
            </div>
            <span className={`badge ${getStatusColor(booking.status)} flex-shrink-0`}>{booking.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {booking.pickup_location}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {booking.number_of_days} days
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formatDateTime(booking.pickup_datetime)}
            </div>
            <div className="flex items-center gap-1">
              → {formatDateTime(booking.return_datetime)}
            </div>
          </div>
          
          {booking.vendor_details && (
            <div className="bg-slate-50 rounded border border-slate-100 p-2 text-xs mb-3">
              <p className="font-semibold text-slate-700 mb-1">Pickup Details:</p>
              <p className="text-slate-600"><span className="font-medium">Location:</span> {booking.vehicle?.locality}, {booking.vehicle?.city}</p>
              <p className="text-slate-600"><span className="font-medium">Address:</span> {booking.vendor_details.address}</p>
              {booking.vehicle?.google_maps_url && (
                <a href={booking.vehicle.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline block mt-1">View on Google Maps</a>
              )}
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="font-semibold text-slate-700 mb-1">Vendor Contact:</p>
                <p className="text-slate-600">{booking.vendor_details.contact_name} • {booking.vendor_details.contact_phone}</p>
              </div>
            </div>
          )}

            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-primary-600">{formatCurrency(booking.total_amount)}</span>
              {booking.payment && (
                <span className={`text-xs px-2 py-1 rounded-full ${booking.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {booking.payment.status === 'COMPLETED' ? 'Paid' : 'Payment Due'}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {booking.payment ? `Via ${booking.payment.method === 'ONLINE' ? 'Razorpay' : 'Pay at Pickup'}` : ''}
              </span>
              <div className="flex gap-3 items-center">
                {canCancel && (
                  <button 
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
                <Link to={`/vehicles/${booking.vehicle?.id}`} className="text-xs text-primary-600 hover:underline font-medium">
                  View Vehicle →
                </Link>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleCancelBooking = async (id) => {
    try {
      await bookingService.cancelBooking(id);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  useEffect(() => {
    bookingService.getBookings()
      .then((res) => { setBookings(res.data.results || []); setLoading(false); })
      .catch((err) => { setError(getErrorMessage(err)); setLoading(false); });
  }, []);

  const upcoming = bookings.filter((b) => ['CONFIRMED', 'PENDING'].includes(b.status));
  const past = bookings.filter((b) => ['COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: bookings.length, color: 'teal' },
            { label: 'Upcoming', value: upcoming.length, color: 'green' },
            { label: 'Completed', value: past.filter((b) => b.status === 'COMPLETED').length, color: 'slate' },
            { label: 'Cancelled', value: past.filter((b) => b.status === 'CANCELLED').length, color: 'red' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-600 mb-1`}>{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Info */}
        <div className="card p-5 mb-8">
          <h2 className="font-bold text-slate-900 mb-3">Profile Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-slate-500">Name</p><p className="font-medium">{user?.name}</p></div>
            <div><p className="text-xs text-slate-500">Email</p><p className="font-medium">{user?.email}</p></div>
            <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium">{user?.phone || '—'}</p></div>
          </div>
        </div>

        {loading && <Loading text="Loading your bookings..." />}
        {error && <ErrorState message={error} />}

        {!loading && !error && (
          <>
            {/* Upcoming Bookings */}
            <div className="mb-8">
              <h2 className="font-bold text-slate-900 mb-4 text-lg">
                Upcoming Bookings
                {upcoming.length > 0 && <span className="ml-2 badge badge-primary">{upcoming.length}</span>}
              </h2>
              {upcoming.length === 0 ? (
                <EmptyState icon={Calendar} title="No upcoming bookings"
                  description="You don't have any upcoming trips."
                  action={<Link to="/search" className="btn-primary mt-2">Browse Vehicles</Link>} />
              ) : (
                <div className="space-y-4">
                  {upcoming.map((b) => <BookingCard key={b.id} booking={b} onCancel={handleCancelBooking} />)}
                </div>
              )}
            </div>

            {/* Past Bookings */}
            {past.length > 0 && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4 text-lg">Past Bookings</h2>
                <div className="space-y-4">
                  {past.map((b) => <BookingCard key={b.id} booking={b} onCancel={handleCancelBooking} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
