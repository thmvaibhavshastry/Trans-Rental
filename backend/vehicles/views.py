"""Public vehicle views."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db.models import Q, Avg

from .models import Vehicle
from .serializers import VehicleSerializer
from .constants import CATEGORY_CONFIG


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(CATEGORY_CONFIG)


class VehicleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        vehicles = Vehicle.objects.filter(status='AVAILABLE').select_related('vendor')

        # ── Standard filters ──────────────────────────────────────────────────
        category = request.query_params.get('category')
        location = request.query_params.get('location')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        seats = request.query_params.get('seats')
        fuel = request.query_params.get('fuel')
        transmission = request.query_params.get('transmission')
        search = request.query_params.get('search')

        if category:
            vehicles = vehicles.filter(category__iexact=category)
        if location:
            vehicles = vehicles.filter(
                Q(location__icontains=location) |
                Q(city__icontains=location)
            )
        if min_price:
            try:
                vehicles = vehicles.filter(price_per_day__gte=float(min_price))
            except (ValueError, TypeError):
                pass
        if max_price:
            try:
                vehicles = vehicles.filter(price_per_day__lte=float(max_price))
            except (ValueError, TypeError):
                pass
        if seats:
            try:
                vehicles = vehicles.filter(seats__gte=int(seats))
            except (ValueError, TypeError):
                pass
        if fuel:
            vehicles = vehicles.filter(fuel__iexact=fuel)
        if transmission:
            vehicles = vehicles.filter(transmission__iexact=transmission)
        if search:
            vehicles = vehicles.filter(
                Q(name__icontains=search) |
                Q(brand__icontains=search) |
                Q(model__icontains=search) |
                Q(location__icontains=search) |
                Q(city__icontains=search)
            )

        # ── Datetime availability filter ──────────────────────────────────────
        # If pickup_datetime + return_datetime are supplied, exclude vehicles that
        # have overlapping confirmed/non-expired-pending bookings (incl. prep buffer).
        pickup_str = request.query_params.get('pickup_datetime')
        return_str = request.query_params.get('return_datetime')

        if pickup_str and return_str:
            try:
                from rest_framework import serializers as drf_serializers
                pickup_dt = drf_serializers.DateTimeField().to_internal_value(pickup_str)
                return_dt = drf_serializers.DateTimeField().to_internal_value(return_str)

                if return_dt > pickup_dt:
                    from django.utils import timezone
                    now = timezone.now()
                    # Build a set of vehicle IDs that are blocked in this window
                    from bookings.models import Booking
                    from datetime import timedelta

                    # We filter in Python to handle per-vehicle prep_time correctly.
                    # First get candidate blocked vehicle IDs efficiently:
                    # A booking blocks a vehicle if:
                    #   booking.pickup_datetime < return_dt  AND
                    #   booking.return_datetime > pickup_dt - MAX_PREP_BUFFER
                    # We use a conservative max prep of 480 min (8 h) for the DB query,
                    # then filter precisely in Python.
                    MAX_PREP = timedelta(minutes=480)
                    candidate_bookings = Booking.objects.filter(
                        vehicle__in=vehicles,
                        pickup_datetime__lt=return_dt,
                        return_datetime__gt=pickup_dt - MAX_PREP,
                    ).filter(
                        Q(status='CONFIRMED') |
                        (Q(status='PENDING') & (Q(expires_at__isnull=True) | Q(expires_at__gt=now)))
                    ).select_related('vehicle')

                    blocked_vehicle_ids = set()
                    for booking in candidate_bookings:
                        v = booking.vehicle
                        prep = timedelta(minutes=v.preparation_time_minutes)
                        existing_return_with_prep = booking.return_datetime + prep
                        if booking.pickup_datetime < return_dt and existing_return_with_prep > pickup_dt:
                            blocked_vehicle_ids.add(v.id)

                    vehicles = vehicles.exclude(id__in=blocked_vehicle_ids)
            except Exception:
                # Invalid datetime — ignore filter, don't crash
                pass

        # ── Annotate avg rating from reviews ──────────────────────────────────
        # Note: Vehicle no longer has a direct rating field; we use Review aggregation.
        vehicles = vehicles.annotate(avg_rating=Avg('reviews__rating'))

        # ── Sorting ───────────────────────────────────────────────────────────
        sort = request.query_params.get('sort', 'recommended')
        if sort == 'price_asc':
            vehicles = vehicles.order_by('price_per_day')
        elif sort == 'price_desc':
            vehicles = vehicles.order_by('-price_per_day')
        elif sort == 'rating':
            vehicles = vehicles.order_by('-avg_rating', '-created_at')
        else:
            # recommended: prefer higher rating, then newest
            vehicles = vehicles.order_by('-avg_rating', '-created_at')

        serializer = VehicleSerializer(vehicles, many=True, context={'request': request})
        return Response({'results': serializer.data, 'count': vehicles.count()})


class VehicleDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            vehicle = Vehicle.objects.select_related('vendor').get(pk=pk)
            serializer = VehicleSerializer(vehicle, context={'request': request})
            return Response(serializer.data)
        except Vehicle.DoesNotExist:
            return Response(
                {'error': 'Vehicle not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
