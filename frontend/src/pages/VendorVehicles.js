import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loading, EmptyState, ErrorState } from '../components/States';
import { vendorService } from '../services/vendorService';
import { formatCurrency, getStatusColor, getErrorMessage } from '../utils/helpers';

export default function VendorVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchVehicles = () => {
    setLoading(true);
    vendorService.getVehicles()
      .then((res) => { setVehicles(res.data.results || []); setLoading(false); })
      .catch((err) => { setError(getErrorMessage(err)); setLoading(false); });
  };

  useEffect(fetchVehicles, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await vendorService.deleteVehicle(id);
      toast.success('Vehicle deleted');
      setVehicles((p) => p.filter((v) => v.id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
            <p className="text-sm text-gray-500">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} listed</p>
          </div>
          <Link to="/vendor/vehicles/add" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Link>
        </div>

        {loading && <Loading />}
        {error && <ErrorState message={error} onRetry={fetchVehicles} />}
        {!loading && !error && vehicles.length === 0 && (
          <EmptyState icon={Car} title="No vehicles yet"
            description="Add your first vehicle to start receiving bookings."
            action={<Link to="/vendor/vehicles/add" className="btn-primary mt-2">Add Your First Vehicle</Link>} />
        )}

        {!loading && !error && vehicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {vehicles.map((v) => (
              <div key={v.id} className="card overflow-hidden">
                <div className="relative h-40">
                  <img
                    src={v.image_display || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                    alt={v.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'; }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`badge ${getStatusColor(v.status)}`}>{v.status}</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-medium">{v.brand}</p>
                  <h3 className="font-bold text-gray-900">{v.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{v.model} · {v.category} · {v.location}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600">{formatCurrency(v.price_per_day)}/day</span>
                    <div className="flex gap-2">
                      <Link to={`/vendor/vehicles/edit/${v.id}`}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(v.id, v.name)}
                        disabled={deleting === v.id}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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
