import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transrentals.settings')
import transrentals.settings
transrentals.settings.DATABASES['default'].update({'ENGINE': 'django.db.backends.sqlite3', 'NAME': 'db.sqlite3', 'ATOMIC_REQUESTS': False})
django.setup()

import unittest
import requests
import json
from datetime import datetime, timedelta
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from vehicles.models import Vehicle
from bookings.models import Booking, Payment
from unittest.mock import patch
import json
import time

User = get_user_model()

class PaymentTests(TestCase):
    def setUp(self):
        self.client = Client()
        res = self.client.post('/api/auth/register/', {'email': 'vendor@test.com', 'password': 'pwd123', 'confirm_password': 'pwd123', 'role': 'VENDOR', 'phone': '1234567890', 'name': 'Vendor A'}, content_type='application/json')
        self.client.post('/api/auth/register/', {'email': 'customer@test.com', 'password': 'pwd123', 'confirm_password': 'pwd123', 'role': 'CUSTOMER', 'phone': '0987654321', 'name': 'Cust A'}, content_type='application/json')
        self.vendor_user = User.objects.get(email='vendor@test.com')
        self.customer_user = User.objects.get(email='customer@test.com')
        
        self.vehicle = Vehicle.objects.create(
            vendor=self.vendor_user.vendor_profile,
            name='Test Car',
            category='SUV',
            price_per_day=1000,
            location='Delhi',
            status='AVAILABLE',
            registration_number='DL1234'
        )

        res = self.client.post('/api/auth/login/', {'email': 'customer@test.com', 'password': 'pwd123'}, content_type='application/json')
        self.cust_token = res.json()['access']
        self.cust_auth = {'HTTP_AUTHORIZATION': f'Bearer {self.cust_token}'}

        res = self.client.post('/api/auth/login/', {'email': 'vendor@test.com', 'password': 'pwd123'}, content_type='application/json')
        self.vendor_token = res.json()['access']
        self.vendor_auth = {'HTTP_AUTHORIZATION': f'Bearer {self.vendor_token}'}

    def test_1_offline_payment_flow(self):
        # Create booking
        res = self.client.post('/api/bookings/', {
            'vehicle_id': self.vehicle.id,
            'customer_name': 'Cust A',
            'customer_phone': '0987654321',
            'customer_email': 'cust@test.com',
            'pickup_location': 'Delhi',
            'pickup_date': '2026-10-01',
            'return_date': '2026-10-03',
            'payment_method': 'OFFLINE'
        }, content_type='application/json', **self.cust_auth)
        self.assertEqual(res.status_code, 201)
        booking_id = res.json()['id']
        
        # Verify initial states
        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, 'CONFIRMED')
        self.assertEqual(booking.payment.method, 'OFFLINE')
        self.assertEqual(booking.payment.status, 'PENDING')

        # Vendor marks payment
        res = self.client.post(f'/api/vendors/bookings/{booking_id}/mark-payment/', **self.vendor_auth)
        self.assertEqual(res.status_code, 200)

        # Verify final states
        booking.payment.refresh_from_db()
        self.assertEqual(booking.payment.status, 'COMPLETED')

    @patch('razorpay.Client')
    def test_2_online_payment_flow(self, mock_razorpay):
        mock_razorpay.return_value.order.create.return_value = {'id': 'order_123'}; import razorpay; mock_razorpay.return_value.utility.verify_payment_signature.side_effect = razorpay.errors.SignatureVerificationError('invalid', 'sig')
        # Create booking
        res = self.client.post('/api/bookings/', {
            'vehicle_id': self.vehicle.id,
            'customer_name': 'Cust A',
            'customer_phone': '0987654321',
            'customer_email': 'cust@test.com',
            'pickup_location': 'Delhi',
            'pickup_date': '2026-11-01',
            'return_date': '2026-11-03',
            'payment_method': 'ONLINE'
        }, content_type='application/json', **self.cust_auth)
        self.assertEqual(res.status_code, 201)
        
        # Razorpay creates order via backend, booking should be pending
        booking_id = res.json()['id']
        razorpay_order_id = res.json().get('razorpay_order_id')
        self.assertIsNotNone(razorpay_order_id)
        
        booking = Booking.objects.get(id=booking_id)
        self.assertEqual(booking.status, 'PENDING')
        self.assertEqual(booking.payment.method, 'ONLINE')
        self.assertEqual(booking.payment.status, 'PENDING')
        self.assertEqual(booking.payment.razorpay_order_id, razorpay_order_id)
        
        # Cannot strictly verify signature from outside without mocking, but we can verify it fails if invalid
        res = self.client.post(f'/api/bookings/{booking_id}/verify-payment/', {
            'razorpay_payment_id': 'pay_test',
            'razorpay_order_id': razorpay_order_id,
            'razorpay_signature': 'invalid_sig'
        }, content_type='application/json', **self.cust_auth)
        
        # Mock verification signature fails
        self.assertEqual(res.status_code, 400)
        
        booking.payment.refresh_from_db()
        self.assertEqual(booking.payment.status, 'FAILED')
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'PENDING') # Booking should not confirm on fail

    def test_3_double_payment_prevention(self):
        res = self.client.post('/api/bookings/', {
            'vehicle_id': self.vehicle.id,
            'customer_name': 'Cust A',
            'customer_phone': '0987654321',
            'customer_email': 'cust@test.com',
            'pickup_location': 'Delhi',
            'pickup_date': '2026-12-01',
            'return_date': '2026-12-03',
            'payment_method': 'OFFLINE'
        }, content_type='application/json', **self.cust_auth)
        booking_id = res.json()['id']

        self.client.post(f'/api/vendors/bookings/{booking_id}/mark-payment/', **self.vendor_auth)
        
        # Second time should fail
        res2 = self.client.post(f'/api/vendors/bookings/{booking_id}/mark-payment/', **self.vendor_auth)
        self.assertEqual(res2.status_code, 400)
        self.assertEqual(res2.json()['error'], 'Payment is already marked as completed.')

if __name__ == '__main__':
    unittest.main()
