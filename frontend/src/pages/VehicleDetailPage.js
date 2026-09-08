import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, Star, ArrowLeft, CheckCircle,
  Building, Calendar, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loading, ErrorState } from '../components/States';
import { vehicleService } from '../services/vehicleService';
import { formatCurrency, getErrorMessage } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../hooks/useCategories';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    vehicleService.getVehicle(id)
      .then((res) => { setVehicle(res.data); setLoading(false); })
      .catch((err) => { setError(getErrorMessage(err)); setLoading(false); });
  }, [id]);

  const handleBook = () => {
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const bookingPath = `/booking/${id}${queryString}`;
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(bookingPath)}`);
    } else {
      navigate(bookingPath);
    }
  };

  if (loading || categoriesLoading) return <div className="min-h-screen bg-slate-50"><Navbar /><Loading text="Loading details..." /></div>;
  if (error) return <div className="min-h-screen bg-slate-50"><Navbar /><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;
  if (!vehicle) return null;

  const features = vehicle.features ? vehicle.features.split(',').map((f) => f.trim()).filter(Boolean) : [];
  const specs = typeof vehicle.specifications === 'string' ? JSON.parse(vehicle.specifications || '{}') : (vehicle.specifications || {});
  
  const activeCategorySpecs = categories[vehicle.category]?.specs || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/search" className="hover:text-primary-600 transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold">{vehicle.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: image + details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="relative h-72 md:h-96">
                <img
                  src={vehicle.image_display || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'; }}
                />
                <div className="absolute top-4 left-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm ${
                    vehicle.status === 'AVAILABLE' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-white'
                  }`}>{vehicle.status}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-primary-700 font-bold text-sm uppercase tracking-wider mb-1">{vehicle.brand}</p>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">{vehicle.name}</h1>
                  <p className="text-slate-500 font-medium">{vehicle.model} · {vehicle.category.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-700">{vehicle.rating > 0 ? vehicle.rating : 'New'}</span>
                </div>
                <span className="text-sm font-medium text-slate-500">
                  {vehicle.reviews_count > 0 ? `(${vehicle.reviews_count} verified reviews)` : '(No reviews yet)'}
                </span>
              </div>

              {/* Dynamic Specs */}
              {activeCategorySpecs.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-slate-900 mb-4 text-lg border-b border-slate-100 pb-2">Specifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeCategorySpecs.map((spec) => {
                      const value = specs[spec.name];
                      if (!value) return null;
                      return (
                        <div key={spec.name} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{spec.label}</p>
                          <p className="text-sm font-bold text-slate-800">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="mb-8">
                 <h3 className="font-bold text-slate-900 mb-4 text-lg border-b border-slate-100 pb-2">Pickup Location</h3>
                 <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="h-5 w-5 text-primary-600" />
                      <span className="font-medium text-lg">
                        {vehicle.locality && vehicle.city ? `${vehicle.locality}, ${vehicle.city}` : vehicle.location}
                      </span>
                    </div>
                    {vehicle.google_maps_url && (
                      <a href={vehicle.google_maps_url} target="_blank" rel="noopener noreferrer" 
                         className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm border border-primary-200 hover:border-primary-300 bg-primary-50 px-4 py-2 rounded-lg transition-colors w-fit">
                        View on Google Maps
                      </a>
                    )}
                 </div>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 text-lg border-b border-slate-100 pb-2">Features Included</h3>
                  <div className="flex flex-wrap gap-3">
                    {features.map((f) => (
                      <div key={f} className="flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-800 rounded-lg px-4 py-2 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vendor Info */}
            {vehicle.vendor && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building className="h-5 w-5 text-primary-600" /> Vendor Information
                </h3>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-primary-700 font-bold text-2xl shadow-sm">
                    {vehicle.vendor.business_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg mb-1">{vehicle.vendor.business_name}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-400" /> {vehicle.vendor.location}</span>
                      {vehicle.vendor.verified && (
                        <span className="flex items-center gap-1 text-primary-600">
                          <CheckCircle className="h-4 w-4 fill-primary-600 text-white" /> Verified Partner
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 sticky top-24">
              <div className="text-center mb-6 pb-6 border-b border-slate-100">
                <p className="text-4xl font-extrabold text-slate-900 mb-1">{formatCurrency(vehicle.price_per_day)}</p>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Per Day</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Registration</span>
                  <span className="font-bold text-slate-800">{vehicle.registration_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Category</span>
                  <span className="font-bold text-slate-800">{vehicle.category.replace('_', ' ')}</span>
                </div>
                {vehicle.vendor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Vendor</span>
                    <span className="font-bold text-slate-800 truncate max-w-[120px]">{vehicle.vendor.business_name}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleBook}
                disabled={vehicle.status !== 'AVAILABLE'}
                className={`w-full text-base font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm ${
                  vehicle.status === 'AVAILABLE' 
                    ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900' 
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}>
                {vehicle.status === 'AVAILABLE' ? (
                  <><Calendar className="h-5 w-5" /> Proceed to Booking</>
                ) : 'Currently Unavailable'}
              </button>

              {!isAuthenticated && vehicle.status === 'AVAILABLE' && (
                <p className="text-xs font-medium text-slate-500 text-center mt-4">
                  You will be asked to sign in securely
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                {['Instant online confirmation', 'Secure Razorpay / Pay at Pickup', 'No hidden charges'].map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                    <CheckCircle className="h-4 w-4 text-primary-500 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
