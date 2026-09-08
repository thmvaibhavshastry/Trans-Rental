import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import BookingPage from './pages/BookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import CustomerDashboard from './pages/CustomerDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VendorDashboard from './pages/VendorDashboard';
import VendorVehicles from './pages/VendorVehicles';
import VehicleFormPage from './pages/VehicleFormPage';
import VendorBookings from './pages/VendorBookings';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500' },
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />

          {/* Guest Only */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Customer Protected Routes */}
          <Route path="/booking/:vehicleId" element={
            <ProtectedRoute requiredRole="CUSTOMER"><BookingPage /></ProtectedRoute>
          } />
          <Route path="/booking-success/:bookingId" element={
            <ProtectedRoute><BookingSuccessPage /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="CUSTOMER"><CustomerDashboard /></ProtectedRoute>
          } />

          {/* Vendor Protected Routes */}
          <Route path="/vendor" element={
            <ProtectedRoute requiredRole="VENDOR"><VendorDashboard /></ProtectedRoute>
          } />
          <Route path="/vendor/vehicles" element={
            <ProtectedRoute requiredRole="VENDOR"><VendorVehicles /></ProtectedRoute>
          } />
          <Route path="/vendor/vehicles/add" element={
            <ProtectedRoute requiredRole="VENDOR"><VehicleFormPage /></ProtectedRoute>
          } />
          <Route path="/vendor/vehicles/edit/:id" element={
            <ProtectedRoute requiredRole="VENDOR"><VehicleFormPage /></ProtectedRoute>
          } />
          <Route path="/vendor/bookings" element={
            <ProtectedRoute requiredRole="VENDOR"><VendorBookings /></ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
