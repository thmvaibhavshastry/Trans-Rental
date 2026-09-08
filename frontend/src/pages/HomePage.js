import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, Shield, Clock, Award, MapPin, CheckCircle, Truck, Tractor, Bike, Bus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchBox from '../components/SearchBox';
import { useCategories } from '../hooks/useCategories';

const DESTINATIONS = [
  { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', count: 45 },
  { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=800&q=80', count: 38 },
  { name: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', count: 31 },
  { name: 'Hyderabad', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80', count: 19 },
];

const WHY_US = [
  { icon: <Shield className="h-6 w-6 text-primary-600" />, title: 'Verified Vendors', desc: 'All vendors are background-checked and verified.' },
  { icon: <CheckCircle className="h-6 w-6 text-primary-600" />, title: 'Instant Confirmation', desc: 'Get your booking confirmed immediately.' },
  { icon: <Clock className="h-6 w-6 text-primary-600" />, title: '24/7 Support', desc: 'Round the clock customer support for you.' },
  { icon: <Award className="h-6 w-6 text-primary-600" />, title: 'Best Prices', desc: 'Competitive prices with no hidden charges.' },
];

const ICON_MAP = {
  Car: Car,
  Bike: Bike,
  Tractor: Tractor,
  Truck: Truck,
  Bus: Bus
};

export default function HomePage() {
  const { categories, loading } = useCategories();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-slate-900 pt-24 pb-32 md:pt-32 md:pb-40">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/images/hero-bg.jpg" 
            alt="Premium vehicle rental" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/80" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight drop-shadow-lg">
            Rent Cars, Bikes &amp; Heavy Equipment
          </h1>
          <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium drop-shadow-md">
            India's premium rental marketplace for personal and commercial vehicles.
          </p>

          <div className="max-w-5xl mx-auto mb-12">
            <SearchBox />
          </div>

        </div>
      </section>

      {/* Browse by Category */}
      {!loading && Object.keys(categories).length > 0 && (
        <section className="py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8">Browse by Category</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.entries(categories).map(([k, v]) => {
                const Icon = ICON_MAP[v.icon] || Car;
                return (
                  <button 
                    key={k}
                    onClick={() => navigate(`/search?category=${k}`)}
                    className="flex flex-col items-center justify-center gap-3 p-4 min-w-[120px] md:min-w-[140px] bg-white border border-slate-200 shadow-sm rounded-xl hover:border-primary-400 hover:shadow-md transition-all text-slate-700 group"
                  >
                    <Icon className="h-8 w-8 text-primary-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold tracking-wide">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Popular Locations */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Popular Locations</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {DESTINATIONS.map((d) => (
              <Link key={d.name} to={`/search?location=${d.name}`}
                className="group rounded-xl overflow-hidden h-48 block relative border border-slate-200 shadow-sm">
                <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/50 transition-colors" />
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-xl font-bold tracking-tight block">{d.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {WHY_US.map((item) => (
              <div key={item.title} className="p-4">
                <div className="mx-auto bg-slate-50 rounded-full w-12 h-12 flex items-center justify-center mb-4 border border-slate-200">
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
