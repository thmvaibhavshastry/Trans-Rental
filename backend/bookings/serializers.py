"""Serializers for bookings app."""

import math
from decimal import Decimal
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q

from .models import Booking, Payment
from vehicles.serializers import VehicleSerializer


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['method', 'status', 'amount', 'razorpay_order_id']
        read_only_fields = ['status', 'amount', 'razorpay_order_id']


class BookingSerializer(serializers.ModelSerializer):
    vehicle = VehicleSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    # Expose datetime fields as ISO strings; also expose human-friendly aliases
    pickup_datetime = serializers.DateTimeField(read_only=True)
    return_datetime = serializers.DateTimeField(read_only=True)
    actual_return_datetime = serializers.DateTimeField(read_only=True)
    pickup_date = serializers.SerializerMethodField()
    return_date = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'vehicle',
            'customer_name', 'customer_phone', 'customer_email',
            'pickup_location', 'pickup_datetime', 'return_datetime',
            'pickup_date', 'return_date',
            'actual_return_datetime',
            'number_of_days', 'rental_amount', 'tax_amount', 'total_amount',
            'status', 'expires_at', 'created_at', 'payment',
        ]
        read_only_fields = ['id', 'customer', 'created_at', 'expires_at']

    def get_pickup_date(self, obj):
        return obj.pickup_datetime.isoformat() if obj.pickup_datetime else None

    def get_return_date(self, obj):
        return obj.return_datetime.isoformat() if obj.return_datetime else None


# ─────────────────────────────────────────────────────────────────────────────
# Pricing helpers
# ─────────────────────────────────────────────────────────────────────────────

def _calculate_rental_days(pickup_dt, return_dt):
    """
    Calculate billable days from two aware datetimes.

    Rules:
    • Duration is measured in hours.
    • Every started 24-hour block counts as 1 day (ceiling division).
    • Minimum: 1 day.

    Examples:
      24 h  → 1 day
      25 h  → 2 days
      48 h  → 2 days
      0 h   → rejected (return <= pickup)
    """
    delta_seconds = (return_dt - pickup_dt).total_seconds()
    if delta_seconds <= 0:
        raise ValueError("return_datetime must be after pickup_datetime")
    hours = delta_seconds / 3600.0
    days = math.ceil(hours / 24)
    return max(days, 1)


def _check_overlap(vehicle, pickup_dt, return_dt, exclude_booking_id=None):
    """
    Return True if there is a confirmed/non-expired-pending booking that
    overlaps the requested [pickup_dt, return_dt) window, taking into account
    the vehicle's preparation_time_minutes buffer after each return.

    Overlap condition (using preparation buffer on the *existing* booking's
    return side only — the new booking's own preparation time is not applied
    here since it is not yet in the DB):
        existing_pickup < return_dt  AND
        (existing_return + prep_buffer) > pickup_dt
    """
    now = timezone.now()
    from datetime import timedelta
    prep = timedelta(minutes=vehicle.preparation_time_minutes)

    qs = Booking.objects.filter(vehicle=vehicle).filter(
        Q(status='CONFIRMED') |
        (Q(status='PENDING') & (Q(expires_at__isnull=True) | Q(expires_at__gt=now)))
    )
    if exclude_booking_id:
        qs = qs.exclude(pk=exclude_booking_id)

    for b in qs:
        # existing booking window + prep buffer on the return end
        existing_pickup = b.pickup_datetime
        existing_return_with_prep = b.return_datetime + prep

        # Overlap: intervals [A_start, A_end) and [B_start, B_end) overlap iff
        #   A_start < B_end AND B_start < A_end
        if existing_pickup < return_dt and existing_return_with_prep > pickup_dt:
            return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# Create serializer
# ─────────────────────────────────────────────────────────────────────────────

class BookingCreateSerializer(serializers.Serializer):
    """
    Accepts pickup_datetime and return_datetime as ISO 8601 strings.
    Handles datetime-aware pricing, preparation-buffer overlap check,
    and expired-pending-booking exclusion.
    """
    vehicle_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=Payment.PAYMENT_METHOD_CHOICES,
        required=False,
        default='OFFLINE',
    )
    customer_name = serializers.CharField(max_length=150)
    customer_phone = serializers.CharField(max_length=15)
    customer_email = serializers.EmailField()
    pickup_location = serializers.CharField(max_length=200)
    pickup_datetime = serializers.DateTimeField(required=False)
    return_datetime = serializers.DateTimeField(required=False)
    pickup_date = serializers.CharField(required=False, write_only=True)
    return_date = serializers.CharField(required=False, write_only=True)

    def validate(self, data):
        from vehicles.models import Vehicle

        # ── 1. Resolve vehicle ───────────────────────────────────────────────
        try:
            vehicle = Vehicle.objects.get(pk=data['vehicle_id'], status='AVAILABLE')
        except Vehicle.DoesNotExist:
            raise serializers.ValidationError(
                {'vehicle_id': 'Vehicle not found or not available.'}
            )

        # Support backward compatibility with pickup_date / return_date
        pickup = data.get('pickup_datetime')
        if not pickup and 'pickup_date' in data:
            val = data.pop('pickup_date')
            try:
                pickup = serializers.DateTimeField().to_internal_value(val)
            except serializers.ValidationError:
                # If date only string like YYYY-MM-DD
                from datetime import datetime
                try:
                    dt = datetime.strptime(val, '%Y-%m-%d')
                    pickup = timezone.make_aware(datetime.combine(dt.date(), datetime.min.time().replace(hour=10)))
                except Exception:
                    raise serializers.ValidationError({'pickup_datetime': 'Invalid datetime format.'})
            data['pickup_datetime'] = pickup

        return_dt = data.get('return_datetime')
        if not return_dt and 'return_date' in data:
            val = data.pop('return_date')
            try:
                return_dt = serializers.DateTimeField().to_internal_value(val)
            except serializers.ValidationError:
                from datetime import datetime
                try:
                    dt = datetime.strptime(val, '%Y-%m-%d')
                    return_dt = timezone.make_aware(datetime.combine(dt.date(), datetime.min.time().replace(hour=10)))
                except Exception:
                    raise serializers.ValidationError({'return_datetime': 'Invalid datetime format.'})
            data['return_datetime'] = return_dt

        if not pickup:
            raise serializers.ValidationError({'pickup_datetime': 'This field is required.'})
        if not return_dt:
            raise serializers.ValidationError({'return_datetime': 'This field is required.'})

        # Remove write_only legacy fields if present
        data.pop('pickup_date', None)
        data.pop('return_date', None)

        # ── 2. Basic temporal sanity ─────────────────────────────────────────
        if return_dt <= pickup:
            raise serializers.ValidationError(
                {'return_datetime': 'Return datetime must be after pickup datetime.'}
            )

        now = timezone.now()
        if pickup < now:
            raise serializers.ValidationError(
                {'pickup_datetime': 'Pickup datetime cannot be in the past.'}
            )

        # ── 3. Overlap + preparation-buffer check ────────────────────────────
        if _check_overlap(vehicle, pickup, return_dt):
            raise serializers.ValidationError(
                {'non_field_errors': 'Vehicle is already booked for the requested time window (including preparation buffer).'}
            )

        # ── 4. Pricing (datetime-aware, ceiling 24-h blocks) ─────────────────
        try:
            days = _calculate_rental_days(pickup, return_dt)
        except ValueError as exc:
            raise serializers.ValidationError({'return_datetime': str(exc)})

        rental_amount = vehicle.price_per_day * Decimal(str(days))
        tax_rate = Decimal('0.18')  # 18 % GST
        tax_amount = rental_amount * tax_rate
        total_amount = rental_amount + tax_amount

        data['vehicle'] = vehicle
        data['number_of_days'] = days
        data['rental_amount'] = rental_amount
        data['tax_amount'] = round(tax_amount, 2)
        data['total_amount'] = round(total_amount, 2)
        return data

    def create(self, validated_data):
        # Pop non-model fields
        validated_data.pop('vehicle_id', None)
        payment_method = validated_data.pop('payment_method')
        customer = self.context['customer']

        # Determine initial booking status based on payment method
        from datetime import timedelta
        if payment_method == 'ONLINE':
            initial_status = 'PENDING'
            validated_data['expires_at'] = timezone.now() + timedelta(minutes=15)
        else:
            initial_status = 'CONFIRMED'

        booking = Booking.objects.create(
            customer=customer,
            status=initial_status,
            **validated_data,
        )

        # Attach payment_method for the view to consume
        booking._payment_method = payment_method
        return booking


# ─────────────────────────────────────────────────────────────────────────────
# Late fee calculator (used by vendor return endpoint)
# ─────────────────────────────────────────────────────────────────────────────

def calculate_late_fee(booking, actual_return_dt):
    """
    Calculate late fee for a booking given the actual return datetime.

    Rules:
    1. If actual_return <= scheduled_return: no fee.
    2. Grace period (vehicle.grace_period_minutes): free buffer.
    3. Chargeable late = max(0, actual_late_minutes - grace_period_minutes).
    4. Fee = ceil(chargeable_late / 60) × vehicle.late_fee_per_hour.
    5. Result rounded to 2 decimal places.

    Returns a dict: {chargeable_hours, late_fee}
    """
    scheduled_return = booking.return_datetime
    if actual_return_dt <= scheduled_return:
        return {'chargeable_hours': 0, 'late_fee': Decimal('0.00')}

    late_seconds = (actual_return_dt - scheduled_return).total_seconds()
    late_minutes = late_seconds / 60.0
    grace = booking.vehicle.grace_period_minutes

    chargeable_minutes = max(0.0, late_minutes - grace)
    if chargeable_minutes <= 0:
        return {'chargeable_hours': 0, 'late_fee': Decimal('0.00')}

    chargeable_hours = math.ceil(chargeable_minutes / 60.0)
    late_fee = Decimal(str(chargeable_hours)) * booking.vehicle.late_fee_per_hour
    return {'chargeable_hours': chargeable_hours, 'late_fee': round(late_fee, 2)}
