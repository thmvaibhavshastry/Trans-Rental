import api from './api';

export const bookingService = {
  createBooking: (data) => api.post('/bookings/', data),
  getBookings: () => api.get('/bookings/'),
  getBooking: (id) => api.get(`/bookings/${id}/`),
  cancelBooking: (id) => api.patch(`/bookings/${id}/`, { status: 'CANCELLED' }),
  verifyPayment: (id, data) => api.post(`/bookings/${id}/verify-payment/`, data),
};
