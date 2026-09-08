// Utility helpers

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Format a datetime string to a human-readable date+time (e.g. "30 Aug 2026, 10:00 AM").
 */
export const formatDateTime = (dtStr) => {
  if (!dtStr) return '-';
  return new Date(dtStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Build a datetime-local input value string (YYYY-MM-DDTHH:MM) from a Date object.
 */
export const toDatetimeLocal = (date) => {
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Calculate billable rental days from two date/datetime strings.
 * Uses ceiling of hours / 24, minimum 1 day.
 * Mirrors the backend _calculate_rental_days() logic.
 */
export const calcDays = (pickup, returnDate) => {
  if (!pickup || !returnDate) return 0;
  const diff = new Date(returnDate) - new Date(pickup);
  if (diff <= 0) return 0;
  const hours = diff / (1000 * 60 * 60);
  return Math.max(1, Math.ceil(hours / 24));
};

export const getStatusColor = (status) => {
  const map = {
    CONFIRMED: 'badge-green',
    PENDING: 'badge-yellow',
    CANCELLED: 'badge-red',
    COMPLETED: 'badge-primary',
    AVAILABLE: 'badge-green',
    BOOKED: 'badge-primary',
    MAINTENANCE: 'badge-yellow',
  };
  return map[status] || 'badge-gray';
};

export const getErrorMessage = (error) => {
  if (!error) return 'An error occurred.';
  const data = error.response?.data;
  if (!data) return error.message || 'Network error. Please try again.';
  if (typeof data === 'string') return data;
  const msgs = Object.entries(data)
    .map(([k, v]) => `${k !== 'detail' ? k + ': ' : ''}${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' | ');
  return msgs || 'An error occurred.';
};

export const CATEGORIES = ['CAR', 'BIKE', 'BUS', 'SELF_DRIVE'];
export const FUEL_TYPES = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'];
export const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'];
export const LOCATIONS = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Goa'];
export const VEHICLE_STATUSES = ['AVAILABLE', 'BOOKED', 'MAINTENANCE'];
