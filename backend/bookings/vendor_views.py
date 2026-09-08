"""Vendor-specific booking views."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from django.utils import timezone

from vendors.permissions import IsVendor
from vendors.models import Vendor
from .models import Booking, Payment
from .serializers import BookingSerializer, calculate_late_fee


class VendorBookingListView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookings = Booking.objects.filter(
            vehicle__vendor=vendor
        ).select_related('vehicle', 'vehicle__vendor', 'customer')

        booking_status = request.query_params.get('status')
        if booking_status:
            bookings = bookings.filter(status__iexact=booking_status)

        serializer = BookingSerializer(bookings, many=True, context={'request': request})
        return Response({'results': serializer.data, 'count': bookings.count()})


class VendorBookingDetailView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request, pk):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            booking = Booking.objects.select_related('vehicle', 'customer').get(
                pk=pk, vehicle__vendor=vendor
            )
            return Response(BookingSerializer(booking, context={'request': request}).data)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    @transaction.atomic
    def patch(self, request, pk):
        """
        Vendor can update booking status.
        When marking COMPLETED, accepts optional actual_return_datetime
        to trigger late-fee calculation.
        """
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            booking = Booking.objects.select_for_update().get(
                pk=pk, vehicle__vendor=vendor
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get('status')
        if new_status not in ['CONFIRMED', 'CANCELLED', 'COMPLETED']:
            return Response(
                {'error': 'Invalid status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        late_fee_info = None

        if new_status == 'COMPLETED':
            # Accept actual_return_datetime if provided; default to now
            actual_return_str = request.data.get('actual_return_datetime')
            if actual_return_str:
                from rest_framework import serializers as drf_serializers
                try:
                    actual_return_dt = drf_serializers.DateTimeField().to_internal_value(
                        actual_return_str
                    )
                except Exception:
                    return Response(
                        {'error': 'Invalid actual_return_datetime format. Use ISO 8601.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                actual_return_dt = timezone.now()

            booking.actual_return_datetime = actual_return_dt
            late_fee_info = calculate_late_fee(booking, actual_return_dt)

        booking.status = new_status
        booking.save()

        from .services import EmailService
        if new_status == 'COMPLETED':
            EmailService.send_booking_completion(booking)
        elif new_status == 'CANCELLED':
            EmailService.send_booking_cancellation(booking, cancelled_by='VENDOR')

        response_data = BookingSerializer(booking, context={'request': request}).data
        if late_fee_info:
            response_data['late_fee_info'] = {
                'chargeable_hours': late_fee_info['chargeable_hours'],
                'late_fee': str(late_fee_info['late_fee']),
                'grace_period_minutes': booking.vehicle.grace_period_minutes,
                'scheduled_return': booking.return_datetime.isoformat(),
                'actual_return': booking.actual_return_datetime.isoformat(),
            }
        return Response(response_data)


class VendorPaymentMarkView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def post(self, request, pk):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            booking = Booking.objects.get(pk=pk, vehicle__vendor=vendor)
            payment = booking.payment
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception:
            return Response(
                {'error': 'Payment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.method != 'OFFLINE':
            return Response(
                {'error': 'Only offline payments can be marked manually.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment.status == 'COMPLETED':
            return Response(
                {'error': 'Payment is already marked as completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = 'COMPLETED'
        payment.save()
        return Response({'status': 'Payment marked as received.'})
