import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Calendar, TrendingUp, Clock, Plus, ArrowRight,
  CheckCircle, AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loading, ErrorState } from '../components/States';
import { vendorService } from '../services/vendorService';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getErrorMessage } from '../utils/helpers';

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    vendorService.getDashboard()
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => { setError(getErrorMessage(err)); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><Loading text="Loading dashboard..." /></div>;
  if (error) return <div className="min-h-screen bg-slate-50"><Navbar /><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;

  const { vendor, stats, recent_bookings } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vendor Dashboard</h1>
            <p className="text-slate-500">Welcome, {vendor?.business_name}</p>
          </div>
          <Link to="/vendor/vehicles/add" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Car className="h-5 w-5 text-primary-600" />, label: 'Total Vehicles', value: stats.total_vehicles, bg: 'bg-primary-50' },
            { icon: <Calendar className="h-5 w-5 text-green-600" />, label: 'Total Bookings', value: stats.total_bookings, bg: 'bg-green-50' },
            { icon: <Clock className="h-5 w-5 text-amber-600" />, label: 'Pending', value: stats.pending_bookings, bg: 'bg-amber-50' },
            { icon: <TrendingUp className="h-5 w-5 text-purple-600" />, label: 'Revenue', value: formatCurrency(stats.revenue), bg: 'bg-purple-50' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className={`${s.bg} rounded-xl p-3 w-fit mb-3`}>{s.icon}</div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { to: '/vendor/vehicles', icon: <Car />, label: 'Manage Vehicles', desc: 'View, edit, delete vehicles' },
            { to: '/vendor/vehicles/add', icon: <Plus />, label: 'Add New Vehicle', desc: 'List a new vehicle for rent' },
            { to: '/vendor/bookings', icon: <Calendar />, label: 'View Bookings', desc: 'See and manage all bookings' },
          ].map((action) => (
            <Link key={action.to} to={action.to}
              className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="bg-primary-100 rounded-xl p-3 text-primary-600 flex-shrink-0">{action.icon}</div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{action.label}</p>
                <p className="text-xs text-slate-400">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 ml-auto" />
            </Link>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-slate-900">Recent Bookings</h2>
            <Link to="/vendor/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>
          {recent_bookings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No bookings yet. Add vehicles to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 pb-3">BOOKING</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 pb-3">VEHICLE</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 pb-3">CUSTOMER</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 pb-3">DATES</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 pb-3">AMOUNT</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 pb-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent_bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 text-xs text-slate-400">#{String(b.id).padStart(6, '0')}</td>
                      <td className="py-3 font-medium text-slate-800">{b.vehicle?.name}</td>
                      <td className="py-3 text-slate-600">{b.customer_name}</td>
                      <td className="py-3 text-slate-500 text-xs">
                        {formatDateTime(b.pickup_datetime)} → {formatDateTime(b.return_datetime)}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{formatCurrency(b.total_amount)}</td>
                      <td className="py-3">
                        <span className={`badge ${getStatusColor(b.status)}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
