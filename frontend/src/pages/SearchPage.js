import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SortAsc, Search, Car } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchBox from '../components/SearchBox';
import VehicleCard from '../components/VehicleCard';
import VehicleFilters from '../components/VehicleFilters';
import { Loading, EmptyState, ErrorState } from '../components/States';
import { vehicleService } from '../services/vehicleService';
import { getErrorMessage, toDatetimeLocal } from '../utils/helpers';
import CustomDropdown from '../components/CustomDropdown';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

function localNow() {
  return toDatetimeLocal(new Date());
}
function localTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDatetimeLocal(d);
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('recommended');

  const pickupDtParam = searchParams.get('pickup_datetime') || localNow();
  const returnDtParam = searchParams.get('return_datetime') || localTomorrow();

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'CAR',
    location: searchParams.get('location') || 'Bangalore',
    min_price: '',
    max_price: '',
    seats: '',
    fuel: '',
    transmission: '',
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        sort,
        ...filters,
        // Pass datetime params for availability filtering
        pickup_datetime: pickupDtParam,
        return_datetime: returnDtParam,
      };
      // Remove empty values and ALL
      Object.keys(params).forEach((k) => (!params[k] || params[k] === 'ALL') && delete params[k]);
      const { data } = await vehicleService.getVehicles(params);
      setVehicles(data.results || []);
      setTotal(data.count || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sort, filters, pickupDtParam, returnDtParam]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Keep filters state in sync with URL searchParams
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: searchParams.get('category') || 'CAR',
      location: searchParams.get('location') || 'Bangalore',
    }));
  }, [searchParams]);

  const resetFilters = () => {
    setFilters({ category: 'CAR', location: 'Bangalore', min_price: '', max_price: '', seats: '', fuel: '', transmission: '' });
    setSort('recommended');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      {/* Search bar */}
      <div className="bg-white border-b border-slate-200 py-4 shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBox compact initialValues={{
            category: filters.category,
            location: filters.location,
            pickup_datetime: pickupDtParam,
            return_datetime: returnDtParam,
          }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <VehicleFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
          </aside>

          {/* Results */}
          <main className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {filters.location && filters.location !== 'ALL' ? `Vehicles in ${filters.location}` : 'All Available Vehicles'}
                </h1>
                {!loading && <p className="text-sm font-medium text-slate-500 mt-1">{total} vehicle{total !== 1 ? 's' : ''} found</p>}
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1 shadow-sm w-48">
                <SortAsc className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <CustomDropdown
                  value={sort}
                  onChange={setSort}
                  options={SORT_OPTIONS}
                  className="w-full"
                />
              </div>
            </div>

            {loading && <Loading text="Searching vehicles..." />}
            {error && <ErrorState message={error} onRetry={fetchVehicles} />}
            {!loading && !error && vehicles.length === 0 && (
              <EmptyState
                icon={Car}
                title="No vehicles found"
                description="Try adjusting your filters, dates, or search for a different location."
                action={<button onClick={resetFilters} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg mt-2 transition-colors shadow-sm">Reset Filters</button>}
              />
            )}
            {!loading && !error && vehicles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {vehicles.map((v) => (
                  <VehicleCard
                    key={v.id}
                    vehicle={v}
                    pickupDatetime={pickupDtParam}
                    returnDatetime={returnDtParam}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
