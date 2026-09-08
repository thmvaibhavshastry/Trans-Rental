"""Admin configuration for bookings app."""

from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer_name', 'vehicle', 'pickup_datetime', 'return_datetime', 'total_amount', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['customer_name', 'customer_email', 'vehicle__name']
    list_editable = ['status']
    readonly_fields = ['rental_amount', 'tax_amount', 'total_amount', 'number_of_days']
