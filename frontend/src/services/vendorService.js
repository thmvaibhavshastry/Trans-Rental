import api from './api';

export const vendorService = {
  getDashboard: () => api.get('/vendors/dashboard/'),
  getProfile: () => api.get('/vendors/profile/'),
  updateProfile: (data) => api.patch('/vendors/profile/', data),

  // Vehicles
  getVehicles: () => api.get('/vendors/vehicles/'),
  addVehicle: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.post('/vendors/vehicles/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateVehicle: (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    return api.put(`/vendors/vehicles/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteVehicle: (id) => api.delete(`/vendors/vehicles/${id}/`),

  // Bookings
  getBookings: (params) => api.get('/vendors/bookings/', { params }),
  updateBookingStatus: (id, status) => api.patch(`/vendors/bookings/${id}/`, { status }),
  markPaymentReceived: (id) => api.post(`/vendors/bookings/${id}/mark-payment/`),
};
