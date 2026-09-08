import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="text-8xl font-black text-gray-100 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <Link to="/search" className="btn-secondary flex items-center gap-2">
            <Search className="h-4 w-4" /> Browse Vehicles
          </Link>
        </div>
      </div>
    </div>
  );
}
