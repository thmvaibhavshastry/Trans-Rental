import api from './api';

export const vehicleService = {
  getVehicles: (params) => api.get('/vehicles/', { params }),
  getVehicle: (id) => api.get(`/vehicles/${id}/`),
  checkAvailability: (vehicleId, params) =>
    api.get(`/vehicles/${vehicleId}/availability/`, { params }),
  createVehicle: (data) => api.post('/vendors/vehicles/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateVehicle: (id, data) => api.put(`/vendors/vehicles/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteVehicle: (id) => api.delete(`/vendors/vehicles/${id}/`),
  getCategories: () => api.get('/vehicles/categories/'),
};
