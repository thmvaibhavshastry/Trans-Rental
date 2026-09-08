"""Vehicle model."""

from django.db import models


from .constants import CATEGORY_CHOICES

class Vehicle(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('BOOKED', 'Booked'),
        ('MAINTENANCE', 'Maintenance'),
    ]

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='vehicles'
    )
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='CAR')
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    registration_number = models.CharField(max_length=20, unique=True)
    image = models.ImageField(upload_to='vehicles/', blank=True, null=True)
    image_url = models.URLField(blank=True, help_text='External image URL fallback')
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    seats = models.IntegerField(null=True, blank=True)
    fuel = models.CharField(max_length=20, null=True, blank=True)
    transmission = models.CharField(max_length=20, null=True, blank=True)
    ac = models.BooleanField(default=True)
    specifications = models.JSONField(default=dict, blank=True, help_text='Category specific details (JSON)')
    location = models.CharField(max_length=100)
    city = models.CharField(max_length=100, blank=True)
    locality = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    google_maps_url = models.URLField(blank=True, max_length=500)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='AVAILABLE')
    features = models.TextField(blank=True, help_text='Comma-separated features')
    preparation_time_minutes = models.IntegerField(default=60, help_text='Turnaround minutes before vehicle is available again after return')
    grace_period_minutes = models.IntegerField(default=60, help_text='Free grace period minutes for late returns')
    late_fee_per_hour = models.DecimalField(max_digits=8, decimal_places=2, default=200.00, help_text='Late fee charged per hour (rounded up) after grace period')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vehicles'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.registration_number}"

    def get_image(self):
        if self.image:
            return self.image.url
        return self.image_url or ''

from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings

class Review(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} - {self.vehicle.name} ({self.rating})"
