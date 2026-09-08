"""Serializers for vehicles app."""

from rest_framework import serializers
from .models import Vehicle
from vendors.serializers import VendorPublicSerializer


class VehicleSerializer(serializers.ModelSerializer):
    vendor = VendorPublicSerializer(read_only=True)
    image_display = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()
    contact_phone = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'vendor', 'name', 'category', 'brand', 'model',
            'registration_number', 'image', 'image_url', 'image_display',
            'price_per_day', 'seats', 'fuel', 'transmission', 'ac', 'specifications',
            'location', 'city', 'locality', 'address', 'google_maps_url', 'status', 'features', 'rating', 'reviews_count', 'created_at',
            'contact_name', 'contact_phone'
        ]
        read_only_fields = ['id', 'created_at']

    def get_rating(self, obj):
        from django.db.models import Avg
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

    def get_reviews_count(self, obj):
        return obj.reviews.count()

    def _is_authorized(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Owner vendor
        if hasattr(request.user, 'vendor_profile') and obj.vendor == request.user.vendor_profile:
            return True
        # Customer with booking
        from bookings.models import Booking
        has_booking = Booking.objects.filter(
            vehicle=obj, 
            customer=request.user, 
            status__in=['PENDING', 'CONFIRMED', 'COMPLETED']
        ).exists()
        return has_booking

    def get_address(self, obj):
        if self._is_authorized(obj):
            return obj.address
        return None

    def get_contact_name(self, obj):
        if self._is_authorized(obj):
            return obj.vendor.user.name
        return None

    def get_contact_phone(self, obj):
        if self._is_authorized(obj):
            return obj.vendor.phone or obj.vendor.user.phone
        return None

    def get_image_display(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'


class VehicleWriteSerializer(serializers.ModelSerializer):
    """Serializer for create/update - vendor is set from request."""
    class Meta:
        model = Vehicle
        fields = [
            'name', 'category', 'brand', 'model',
            'registration_number', 'image', 'image_url',
            'price_per_day', 'seats', 'fuel', 'transmission', 'ac', 'specifications',
            'location', 'city', 'locality', 'address', 'google_maps_url', 'status', 'features'
        ]

    def create(self, validated_data):
        vendor = self.context['vendor']
        return Vehicle.objects.create(vendor=vendor, **validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
