"""Customer booking views."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from django.db.models import Q

from vendors.permissions import IsCustomer
from .models import Booking, Payment
from .serializers import BookingSerializer, BookingCreateSerializer


class BookingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Customer sees their own bookings."""
        if request.user.role == 'CUSTOMER':
            bookings = Booking.objects.filter(customer=request.user).select_related(
                'vehicle', 'vehicle__vendor'
            )
        else:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingSerializer(bookings, many=True, context={'request': request})
        return Response({'results': serializer.data, 'count': bookings.count()})

    @transaction.atomic
    def post(self, request):
        """Create a new booking (customers only)."""
        from vehicles.models import Vehicle

        vehicle_id = request.data.get('vehicle_id')
        if vehicle_id:
            try:
                # Lock the vehicle row to prevent concurrent overlapping bookings
                Vehicle.objects.select_for_update().get(pk=vehicle_id)
            except Vehicle.DoesNotExist:
                return Response(
                    {'error': 'Vehicle not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        serializer = BookingCreateSerializer(
            data=request.data,
            context={'customer': request.user},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        booking = serializer.save()
        payment_method = getattr(booking, '_payment_method', 'OFFLINE')

        import razorpay
        from django.conf import settings

        if payment_method == 'ONLINE':
            payment_mode = getattr(settings, 'PAYMENT_MODE', 'MOCK')
            if payment_mode == 'RAZORPAY':
                try:
                    client = razorpay.Client(
                        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                    )
                    order_amount = int(booking.total_amount * 100)  # paise
                    razorpay_order = client.order.create({
                        'amount': order_amount,
                        'currency': 'INR',
                        'receipt': f'booking_{booking.id}',
                        'payment_capture': '1',
                    })
                    Payment.objects.create(
                        booking=booking,
                        method=payment_method,
                        status='PENDING',
                        amount=booking.total_amount,
                        razorpay_order_id=razorpay_order['id'],
                    )
                    # Email sent only on successful verification
                    response_data = BookingSerializer(booking, context={'request': request}).data
                    response_data['razorpay_order_id'] = razorpay_order['id']
                    response_data['payment_mode'] = 'RAZORPAY'
                    return Response(response_data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    booking.delete()
                    return Response(
                        {'error': f'Razorpay error: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                # MOCK payment mode
                mock_order_id = f'mock_order_{booking.id}'
                Payment.objects.create(
                    booking=booking,
                    method=payment_method,
                    status='PENDING',
                    amount=booking.total_amount,
                    razorpay_order_id=mock_order_id,
                )
                response_data = BookingSerializer(booking, context={'request': request}).data
                response_data['payment_mode'] = 'MOCK'
                response_data['mock_order_id'] = mock_order_id
                response_data['razorpay_order_id'] = mock_order_id
                return Response(response_data, status=status.HTTP_201_CREATED)

        else:
            # Offline payment — confirmed immediately
            Payment.objects.create(
                booking=booking,
                method=payment_method,
                status='PENDING',
                amount=booking.total_amount,
            )
            from .services import EmailService
            EmailService.send_booking_confirmation(booking)
            return Response(
                BookingSerializer(booking, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )


class PaymentVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            booking = Booking.objects.select_for_update().get(pk=pk, customer=request.user)
            payment = booking.payment
        except (Booking.DoesNotExist, Payment.DoesNotExist):
            return Response(
                {'error': 'Booking or Payment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status != 'PENDING':
            return Response(
                {'error': 'Booking is not pending.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment.method != 'ONLINE':
            return Response(
                {'error': 'Only online payments can be verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.expires_at and booking.expires_at < timezone.now():
            booking.status = 'CANCELLED'
            booking.save()
            return Response(
                {'error': 'Booking has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')

        # Verify order_id matches the one generated for THIS booking
        if razorpay_order_id and razorpay_order_id != payment.razorpay_order_id:
            return Response(
                {'error': 'Invalid order ID.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.conf import settings
        payment_mode = getattr(settings, 'PAYMENT_MODE', 'MOCK')
        razorpay_signature = request.data.get('razorpay_signature')

        if razorpay_signature:
            # Explicit Razorpay signature verification requested
            import razorpay
            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            try:
                params_dict = {
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_signature': razorpay_signature,
                }
                client.utility.verify_payment_signature(params_dict)

                payment.razorpay_payment_id = razorpay_payment_id
                payment.razorpay_signature = razorpay_signature
                payment.status = 'COMPLETED'
                payment.save()

                booking.status = 'CONFIRMED'
                booking.save()

                from .services import EmailService
                EmailService.send_booking_confirmation(booking)
                return Response({'status': 'Payment verified successfully.'})

            except razorpay.errors.SignatureVerificationError:
                payment.status = 'FAILED'
                payment.save()
                return Response(
                    {'error': 'Invalid payment signature.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif payment_mode == 'MOCK':
            mock_status = request.data.get('mock_status', 'SUCCESS')
            if mock_status == 'FAILED':
                payment.status = 'FAILED'
                payment.save()
                return Response(
                    {'error': 'Simulated payment failure.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payment.razorpay_payment_id = f'mock_payment_{booking.id}'
            payment.razorpay_signature = 'mock_signature'
            payment.status = 'COMPLETED'
            payment.save()

            booking.status = 'CONFIRMED'
            booking.save()

            from .services import EmailService
            EmailService.send_booking_confirmation(booking)
            return Response({'status': 'Payment verified successfully.'})

        else:
            return Response(
                {'error': 'Missing signature.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            if request.user.role == 'CUSTOMER':
                booking = Booking.objects.select_related(
                    'vehicle', 'vehicle__vendor'
                ).get(pk=pk, customer=request.user)
            else:
                return Response(
                    {'error': 'Not authorized.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer = BookingSerializer(booking, context={'request': request})
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request, pk):
        """Allow customer to cancel their own booking."""
        try:
            booking = Booking.objects.get(pk=pk, customer=request.user)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get('status')
        if new_status == 'CANCELLED' and booking.status not in ['COMPLETED']:
            booking.status = 'CANCELLED'
            booking.save()
            from .services import EmailService
            EmailService.send_booking_cancellation(booking)
            return Response(BookingSerializer(booking, context={'request': request}).data)
        return Response(
            {'error': 'Cannot update this booking.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class VehicleAvailabilityView(APIView):
    """
    GET /api/vehicles/<vehicle_id>/availability/?pickup_datetime=...&return_datetime=...

    Returns whether the vehicle is available for the requested window.
    Public endpoint (no auth required).
    """
    permission_classes = [AllowAny]

    def get(self, request, vehicle_id):
        from vehicles.models import Vehicle
        from .serializers import _check_overlap

        try:
            vehicle = Vehicle.objects.get(pk=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response(
                {'error': 'Vehicle not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        pickup_str = request.query_params.get('pickup_datetime')
        return_str = request.query_params.get('return_datetime')

        if not pickup_str or not return_str:
            return Response(
                {'error': 'pickup_datetime and return_datetime are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from rest_framework import serializers as drf_serializers
        try:
            pickup_dt = drf_serializers.DateTimeField().to_internal_value(pickup_str)
            return_dt = drf_serializers.DateTimeField().to_internal_value(return_str)
        except Exception:
            return Response(
                {'error': 'Invalid datetime format. Use ISO 8601.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if return_dt <= pickup_dt:
            return Response(
                {'available': False, 'reason': 'Return datetime must be after pickup datetime.'}
            )

        if vehicle.status != 'AVAILABLE':
            return Response(
                {'available': False, 'reason': f'Vehicle status is {vehicle.status}.'}
            )

        overlapping = _check_overlap(vehicle, pickup_dt, return_dt)
        from datetime import timedelta
        prep_buffer = timedelta(minutes=vehicle.preparation_time_minutes)

        return Response({
            'available': not overlapping,
            'vehicle_id': vehicle_id,
            'pickup_datetime': pickup_dt.isoformat(),
            'return_datetime': return_dt.isoformat(),
            'preparation_time_minutes': vehicle.preparation_time_minutes,
            'grace_period_minutes': vehicle.grace_period_minutes,
            'late_fee_per_hour': str(vehicle.late_fee_per_hour),
        })
