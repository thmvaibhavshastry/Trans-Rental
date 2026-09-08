import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_html_email(subject, template_name, context, recipient_list):
        try:
            html_message = render_to_string(template_name, context)
            plain_message = strip_tags(html_message)
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_list}: {str(e)}")
            return False

    @classmethod
    def send_booking_confirmation(cls, booking):
        # Email to Customer
        customer_context = {'booking': booking, 'is_vendor': False}
        cls.send_html_email(
            subject=f"Booking Confirmation - #{booking.id}",
            template_name="emails/booking_confirmation.html",
            context=customer_context,
            recipient_list=[booking.customer_email or booking.customer.email]
        )
        
        # Email to Vendor
        vendor_context = {'booking': booking, 'is_vendor': True}
        cls.send_html_email(
            subject=f"New Booking Received - #{booking.id}",
            template_name="emails/booking_confirmation.html",
            context=vendor_context,
            recipient_list=[booking.vehicle.vendor.user.email]
        )

    @classmethod
    def send_booking_cancellation(cls, booking, cancelled_by='CUSTOMER'):
        # Email to Customer
        customer_context = {'booking': booking, 'is_vendor': False, 'cancelled_by': cancelled_by}
        subject_cust = f"Booking Cancelled - #{booking.id}"
        if cancelled_by == 'VENDOR':
            subject_cust = f"Booking Cancelled by Vendor - #{booking.id}"
            
        cls.send_html_email(
            subject=subject_cust,
            template_name="emails/booking_cancellation.html",
            context=customer_context,
            recipient_list=[booking.customer_email or booking.customer.email]
        )
        
        # Email to Vendor
        if cancelled_by == 'CUSTOMER':
            vendor_context = {'booking': booking, 'is_vendor': True, 'cancelled_by': cancelled_by}
            cls.send_html_email(
                subject=f"Booking Cancelled by Customer - #{booking.id}",
                template_name="emails/booking_cancellation.html",
                context=vendor_context,
                recipient_list=[booking.vehicle.vendor.user.email]
            )

    @classmethod
    def send_booking_completion(cls, booking):
        # Email to Customer
        context = {'booking': booking}
        cls.send_html_email(
            subject=f"Rental Completed - #{booking.id}",
            template_name="emails/booking_completion.html",
            context=context,
            recipient_list=[booking.customer_email or booking.customer.email]
        )
