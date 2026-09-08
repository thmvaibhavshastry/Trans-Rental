"""Admin configuration for vehicles app."""

from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'model', 'category', 'vendor', 'location', 'price_per_day', 'status']
    list_filter = ['category', 'status', 'fuel', 'transmission']
    search_fields = ['name', 'brand', 'model', 'registration_number']
    list_editable = ['status']
