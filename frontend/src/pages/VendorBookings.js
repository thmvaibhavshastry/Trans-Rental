import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loading, EmptyState, ErrorState } from '../components/States';
import { vendorService } from '../services/vendorService';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function VendorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    vendorService.getBookings(filter ? { status: filter } : {})
      .then((res) => { setBookings(res.data.results || []); setLoading(false); })
      .catch((err) => { setError(getErrorMessage(err)); setLoading(false); });
  };

  useEffect(fetchBookings, [filter]);

  const handleStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await vendorService.updateBookingStatus(id, newStatus);
      toast.success('Booking status updated');
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkPayment = async (id) => {
    setUpdating(id);
    try {
      await vendorService.markPaymentReceived(id);
      toast.success('Payment marked as received');
      setBookings((prev) => prev.map((b) => {
        if (b.id === id && b.payment) {
          return { ...b, payment: { ...b.payment, status: 'COMPLETED' } };
        }
        return b;
      }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
            <p className="text-sm text-slate-500">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  filter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={fetchBookings} />}
        {!loading && !error && bookings.length === 0 && (
          <EmptyState icon={Calendar} title="No bookings found"
            description={filter ? `No ${filter.toLowerCase()} bookings yet.` : 'No bookings yet for your vehicles.'} />
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="card p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs text-slate-400">Booking #{String(b.id).padStart(6, '0')}</span>
                        <h3 className="font-bold text-slate-900">{b.vehicle?.name}</h3>
                        <p className="text-sm text-slate-600">Customer: {b.customer_name} · {b.customer_phone}</p>
                      </div>
                      <span className={`badge ${getStatusColor(b.status)}`}>{b.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Pickup Location</p>
                        <p className="font-medium text-slate-800">{b.pickup_location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="font-medium text-slate-800">{b.number_of_days} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Pickup → Return</p>
                        <p className="font-medium text-slate-800 text-xs">{formatDateTime(b.pickup_datetime)} → {formatDateTime(b.return_datetime)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total Amount</p>
                        <p className="font-bold text-primary-600">{formatCurrency(b.total_amount)}</p>
                      </div>
                    </div>
                    {/* Payment Info */}
                    {b.payment && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs">Payment Method:</span>
                          <span className="font-medium">{b.payment.method === 'ONLINE' ? 'Razorpay' : 'Pay at Pickup'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs">Payment Status:</span>
                          <span className={`badge ${b.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {b.payment.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Status Update */}
                  {['PENDING', 'CONFIRMED'].includes(b.status) && (
                    <div className="flex md:flex-col gap-2 flex-shrink-0">
                      {b.status === 'PENDING' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Accept this booking?')) handleStatus(b.id, 'CONFIRMED');
                          }} 
                          disabled={updating === b.id}
                          className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
                          Confirm
                        </button>
                      )}
                      
                      {b.status === 'CONFIRMED' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Mark this booking as completed?')) handleStatus(b.id, 'COMPLETED');
                          }} 
                          disabled={updating === b.id}
                          className="w-full bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm py-2 px-4 font-bold disabled:opacity-50 transition-colors">
                          Mark Complete
                        </button>
                      )}

                      {b.payment?.method === 'OFFLINE' && b.payment?.status === 'PENDING' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Mark payment as received from customer?')) handleMarkPayment(b.id);
                          }} 
                          disabled={updating === b.id}
                          className="w-full bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm py-2 px-4 font-bold disabled:opacity-50 transition-colors mt-2">
                          Payment Received
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this booking?')) handleStatus(b.id, 'CANCELLED');
                        }} 
                        disabled={updating === b.id}
                        className="btn-danger text-sm py-2 px-4 disabled:opacity-50 mt-2">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
