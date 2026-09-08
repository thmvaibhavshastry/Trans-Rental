"""
Migration: DateField -> DateTimeField for booking pickup/return.
Existing test data is converted to 10:00 AM IST (UTC+05:30).
"""

from django.db import migrations, models
import datetime
import pytz


def convert_dates_to_datetimes(apps, schema_editor):
    """Convert existing date-only values to timezone-aware datetimes at 10:00 IST."""
    Booking = apps.get_model('bookings', 'Booking')
    ist = pytz.timezone('Asia/Kolkata')
    for booking in Booking.objects.all():
        # Read old DateField values (stored as date objects when accessed via RunPython)
        if booking.pickup_date:
            d = booking.pickup_date
            booking.pickup_datetime = ist.localize(
                datetime.datetime(d.year, d.month, d.day, 10, 0, 0)
            )
        if booking.return_date:
            d = booking.return_date
            booking.return_datetime = ist.localize(
                datetime.datetime(d.year, d.month, d.day, 10, 0, 0)
            )
        booking.save(update_fields=['pickup_datetime', 'return_datetime'])


def reverse_datetimes_to_dates(apps, schema_editor):
    """Reverse: extract date portion from datetimes back to date fields."""
    Booking = apps.get_model('bookings', 'Booking')
    ist = pytz.timezone('Asia/Kolkata')
    for booking in Booking.objects.all():
        if booking.pickup_datetime:
            local_dt = booking.pickup_datetime.astimezone(ist)
            booking.pickup_date = local_dt.date()
        if booking.return_datetime:
            local_dt = booking.return_datetime.astimezone(ist)
            booking.return_date = local_dt.date()
        booking.save(update_fields=['pickup_date', 'return_date'])


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0003_booking_expires_at'),
    ]

    operations = [
        # 1. Add new datetime fields as nullable alongside the old date fields
        migrations.AddField(
            model_name='booking',
            name='pickup_datetime',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='return_datetime',
            field=models.DateTimeField(null=True, blank=True),
        ),
        # 2. Copy existing date data into the new datetime fields at 10:00 AM IST
        migrations.RunPython(convert_dates_to_datetimes, reverse_datetimes_to_dates),
        # 3. Make the new fields non-nullable now that data is populated
        migrations.AlterField(
            model_name='booking',
            name='pickup_datetime',
            field=models.DateTimeField(),
        ),
        migrations.AlterField(
            model_name='booking',
            name='return_datetime',
            field=models.DateTimeField(),
        ),
        # 4. Remove old DateField columns
        migrations.RemoveField(
            model_name='booking',
            name='pickup_date',
        ),
        migrations.RemoveField(
            model_name='booking',
            name='return_date',
        ),
        # 5. Add actual_return_datetime for late-return tracking
        migrations.AddField(
            model_name='booking',
            name='actual_return_datetime',
            field=models.DateTimeField(null=True, blank=True),
        ),
    ]
