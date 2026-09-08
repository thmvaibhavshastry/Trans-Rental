"""URL patterns for bookings app."""

from django.urls import path
from .views import (
    BookingListCreateView,
    BookingDetailView,
    PaymentVerifyView,
    VehicleAvailabilityView,
)

urlpatterns = [
    path('bookings/', BookingListCreateView.as_view(), name='booking-list-create'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:pk>/verify-payment/', PaymentVerifyView.as_view(), name='booking-verify-payment'),
    # Availability check — public
    path('vehicles/<int:vehicle_id>/availability/', VehicleAvailabilityView.as_view(), name='vehicle-availability'),
]
