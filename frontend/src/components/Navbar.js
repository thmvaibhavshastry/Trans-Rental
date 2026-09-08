import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout, isVendor } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <div className="bg-primary-600 p-1.5 rounded-lg">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span>Trans<span className="text-slate-900">Rentals</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Browse Vehicles</Link>
            {isAuthenticated && !isVendor && (
              <Link to="/dashboard" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">My Bookings</Link>
            )}
            {isVendor && (
              <Link to="/vendor" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Vendor Dashboard</Link>
            )}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative z-[60]">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
                >
                  <div className="bg-primary-600 rounded-full p-1">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-[200]">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{user?.role}</span>
                    </div>
                    {!isVendor && (
                      <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    )}
                    {isVendor && (
                      <Link to="/vendor" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <LayoutDashboard className="h-4 w-4" /> Vendor Panel
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            <Link to="/search" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">Browse Vehicles</Link>
            {isAuthenticated && !isVendor && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">My Bookings</Link>
            )}
            {isVendor && (
              <Link to="/vendor" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">Vendor Dashboard</Link>
            )}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
            ) : (
              <div className="flex gap-2 px-4 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-sm flex-1 text-center">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-sm flex-1 text-center">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
