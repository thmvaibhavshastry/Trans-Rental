import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <Car className="h-5 w-5 text-white" />
              </div>
              TransRentals
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              India's trusted vehicle rental marketplace. Find the perfect vehicle for your journey.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Instagram</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="hover:text-white transition-colors">Browse Vehicles</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Become a Customer</Link></li>
              <li><Link to="/register?role=vendor" className="hover:text-white transition-colors">List Your Vehicle</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {['Cars', 'Bikes', 'JCB / Heavy', 'Commercial'].map((c) => (
                <li key={c}>
                  <Link to={`/search?category=${c.toUpperCase().replace(' ', '_')}`} className="hover:text-white transition-colors">{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-400 flex-shrink-0" /> Bangalore, India</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary-400 flex-shrink-0" /> +91 98765 43210</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary-400 flex-shrink-0" /> support@transrentals.in</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2024 TransRentals. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
