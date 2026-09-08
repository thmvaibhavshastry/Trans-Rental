"""Serializers for vendors app."""

from rest_framework import serializers
from .models import Vendor
from accounts.serializers import UserSerializer


class VendorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    total_vehicles = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = ['id', 'user', 'business_name', 'phone', 'location', 'verified', 'total_vehicles', 'created_at']
        read_only_fields = ['id', 'user', 'verified', 'created_at']

    def get_total_vehicles(self, obj):
        return obj.vehicles.count()


class VendorPublicSerializer(serializers.ModelSerializer):
    """Minimal vendor info for vehicle listings."""
    class Meta:
        model = Vendor
        fields = ['id', 'business_name', 'location', 'verified']
