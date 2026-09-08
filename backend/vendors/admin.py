"""Admin configuration for vendors app."""

from django.contrib import admin
from .models import Vendor


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'location', 'verified', 'created_at']
    list_filter = ['verified']
    search_fields = ['business_name', 'user__email']
