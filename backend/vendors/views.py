"""Views for vendors app."""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Vendor
from .serializers import VendorSerializer
from .permissions import IsVendor


class VendorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        from vehicles.models import Vehicle
        from bookings.models import Booking

        vehicles = Vehicle.objects.filter(vendor=vendor)
        bookings = Booking.objects.filter(vehicle__vendor=vendor)

        # Revenue: sum of total_amount for CONFIRMED/COMPLETED bookings
        from django.db.models import Sum
        revenue = bookings.filter(
            status__in=['CONFIRMED', 'COMPLETED']
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Recent bookings
        from bookings.serializers import BookingSerializer
        recent_bookings = BookingSerializer(
            bookings.order_by('-created_at')[:10],
            many=True
        ).data

        return Response({
            'vendor': VendorSerializer(vendor).data,
            'stats': {
                'total_vehicles': vehicles.count(),
                'total_bookings': bookings.count(),
                'pending_bookings': bookings.filter(status='PENDING').count(),
                'revenue': float(revenue),
            },
            'recent_bookings': recent_bookings,
        })


class VendorProfileView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor = request.user.vendor_profile
            return Response(VendorSerializer(vendor).data)
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VendorSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
