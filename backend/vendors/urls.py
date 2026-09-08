"""URL patterns for vendors app."""

from django.urls import path, include
from .views import VendorDashboardView, VendorProfileView
from vehicles.vendor_views import VendorVehicleListView, VendorVehicleDetailView
from bookings.vendor_views import VendorBookingListView, VendorBookingDetailView, VendorPaymentMarkView

urlpatterns = [
    path('dashboard/', VendorDashboardView.as_view(), name='vendor-dashboard'),
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    # Vehicle management
    path('vehicles/', VendorVehicleListView.as_view(), name='vendor-vehicles'),
    path('vehicles/<int:pk>/', VendorVehicleDetailView.as_view(), name='vendor-vehicle-detail'),
    # Booking management
    path('bookings/', VendorBookingListView.as_view(), name='vendor-bookings'),
    path('bookings/<int:pk>/', VendorBookingDetailView.as_view(), name='vendor-booking-detail'),
    path('bookings/<int:pk>/mark-payment/', VendorPaymentMarkView.as_view(), name='vendor-booking-mark-payment'),
]
