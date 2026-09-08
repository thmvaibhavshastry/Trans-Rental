"""Management command to seed development data."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample vendors and vehicles'

    def handle(self, *args, **kwargs):
        from vendors.models import Vendor
        from vehicles.models import Vehicle

        self.stdout.write('[*] Seeding database...')

        # Create vendor users
        vendor1_user, _ = User.objects.get_or_create(
            email='vendor1@transrentals.in',
            defaults={
                'name': 'Rajesh Kumar',
                'phone': '9876543210',
                'role': 'VENDOR',
            }
        )
        if _:
            vendor1_user.set_password('vendor123')
            vendor1_user.save()

        vendor2_user, _ = User.objects.get_or_create(
            email='vendor2@transrentals.in',
            defaults={
                'name': 'Priya Sharma',
                'phone': '9876543211',
                'role': 'VENDOR',
            }
        )
        if _:
            vendor2_user.set_password('vendor123')
            vendor2_user.save()

        # Create vendor profiles
        vendor1, _ = Vendor.objects.get_or_create(
            user=vendor1_user,
            defaults={
                'business_name': 'Rajesh Rentals',
                'phone': '9876543210',
                'location': 'Bangalore',
                'verified': True,
            }
        )

        vendor2, _ = Vendor.objects.get_or_create(
            user=vendor2_user,
            defaults={
                'business_name': 'Priya Car Rentals',
                'phone': '9876543211',
                'location': 'Mumbai',
                'verified': True,
            }
        )

        # Create a customer
        customer_user, _ = User.objects.get_or_create(
            email='customer@transrentals.in',
            defaults={
                'name': 'Arjun Reddy',
                'phone': '9876543212',
                'role': 'CUSTOMER',
            }
        )
        if _:
            customer_user.set_password('customer123')
            customer_user.save()

        # Create admin
        admin_user, _ = User.objects.get_or_create(
            email='admin@transrentals.in',
            defaults={
                'name': 'Admin User',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if _:
            admin_user.set_password('admin123')
            admin_user.save()

        # Vehicle data
        vehicles_data = [
            {
                'vendor': vendor1,
                'name': 'Toyota Innova Crysta',
                'category': 'CAR',
                'brand': 'Toyota',
                'model': 'Innova Crysta',
                'registration_number': 'KA01AB1234',
                'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
                'price_per_day': 3500,
                'seats': 7,
                'fuel': 'DIESEL',
                'transmission': 'MANUAL',
                'ac': True,
                'location': 'Bangalore',
                'status': 'AVAILABLE',
                'features': 'GPS,Music System,USB Charging,Rear Camera',
                'rating': 4.8,
                'reviews_count': 124,
            },
            {
                'vendor': vendor1,
                'name': 'Hyundai Creta',
                'category': 'CAR',
                'brand': 'Hyundai',
                'model': 'Creta',
                'registration_number': 'KA02CD5678',
                'image_url': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
                'price_per_day': 2500,
                'seats': 5,
                'fuel': 'PETROL',
                'transmission': 'AUTOMATIC',
                'ac': True,
                'location': 'Bangalore',
                'status': 'AVAILABLE',
                'features': 'Sunroof,Music System,Cruise Control,Apple CarPlay',
                'rating': 4.7,
                'reviews_count': 89,
            },
            {
                'vendor': vendor1,
                'name': 'Maruti Swift',
                'category': 'SELF_DRIVE',
                'brand': 'Maruti',
                'model': 'Swift',
                'registration_number': 'KA03EF9012',
                'image_url': 'https://images.unsplash.com/photo-1540065816-1c5ae5cdd3b4?w=800',
                'price_per_day': 1200,
                'seats': 5,
                'fuel': 'PETROL',
                'transmission': 'MANUAL',
                'ac': True,
                'location': 'Bangalore',
                'status': 'AVAILABLE',
                'features': 'Music System,Power Windows,Central Locking',
                'rating': 4.5,
                'reviews_count': 67,
            },
            {
                'vendor': vendor1,
                'name': 'Mahindra XUV700',
                'category': 'CAR',
                'brand': 'Mahindra',
                'model': 'XUV700',
                'registration_number': 'KA04GH3456',
                'image_url': 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=800',
                'price_per_day': 4500,
                'seats': 7,
                'fuel': 'DIESEL',
                'transmission': 'AUTOMATIC',
                'ac': True,
                'location': 'Hyderabad',
                'status': 'AVAILABLE',
                'features': 'ADAS,Panoramic Sunroof,4WD,Sony Sound System',
                'rating': 4.9,
                'reviews_count': 45,
            },
            {
                'vendor': vendor2,
                'name': 'Kia Carens',
                'category': 'CAR',
                'brand': 'Kia',
                'model': 'Carens',
                'registration_number': 'MH01IJ7890',
                'image_url': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
                'price_per_day': 3000,
                'seats': 6,
                'fuel': 'DIESEL',
                'transmission': 'AUTOMATIC',
                'ac': True,
                'location': 'Mumbai',
                'status': 'AVAILABLE',
                'features': 'Bose Sound System,Ventilated Seats,ADAS,360 Camera',
                'rating': 4.6,
                'reviews_count': 38,
            },
            {
                'vendor': vendor2,
                'name': 'Toyota Fortuner',
                'category': 'CAR',
                'brand': 'Toyota',
                'model': 'Fortuner',
                'registration_number': 'MH02KL1234',
                'image_url': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
                'price_per_day': 6000,
                'seats': 7,
                'fuel': 'DIESEL',
                'transmission': 'AUTOMATIC',
                'ac': True,
                'location': 'Mumbai',
                'status': 'AVAILABLE',
                'features': '4x4,Leather Seats,JBL Sound,Roof Rails,Fog Lamps',
                'rating': 4.9,
                'reviews_count': 78,
            },
            {
                'vendor': vendor2,
                'name': 'Maruti Ertiga',
                'category': 'CAR',
                'brand': 'Maruti',
                'model': 'Ertiga',
                'registration_number': 'DL01MN5678',
                'image_url': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
                'price_per_day': 2000,
                'seats': 7,
                'fuel': 'CNG',
                'transmission': 'MANUAL',
                'ac': True,
                'location': 'Delhi',
                'status': 'AVAILABLE',
                'features': 'Spacious,Family Friendly,Music System,USB Charging',
                'rating': 4.4,
                'reviews_count': 56,
            },
            {
                'vendor': vendor1,
                'name': 'Hyundai Venue',
                'category': 'SELF_DRIVE',
                'brand': 'Hyundai',
                'model': 'Venue',
                'registration_number': 'TN01OP9012',
                'image_url': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
                'price_per_day': 1800,
                'seats': 5,
                'fuel': 'PETROL',
                'transmission': 'AUTOMATIC',
                'ac': True,
                'location': 'Chennai',
                'status': 'AVAILABLE',
                'features': 'Connected Car Tech,Wireless Charging,Sunroof,Voice Commands',
                'rating': 4.5,
                'reviews_count': 42,
            },
            {
                'vendor': vendor2,
                'name': 'Tata Nexon',
                'category': 'SELF_DRIVE',
                'brand': 'Tata',
                'model': 'Nexon EV',
                'registration_number': 'GA01QR3456',
                'image_url': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
                'price_per_day': 2200,
                'seats': 5,
                'fuel': 'ELECTRIC',
                'transmission': 'AUTOMATIC',
                'ac': True,
                'location': 'Goa',
                'status': 'AVAILABLE',
                'features': 'Electric,Zero Emission,Fast Charging,Regenerative Braking',
                'rating': 4.6,
                'reviews_count': 33,
            },
            {
                'vendor': vendor2,
                'name': 'MG Hector',
                'category': 'CAR',
                'brand': 'MG',
                'model': 'Hector',
                'registration_number': 'MH03ST7890',
                'image_url': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
                'price_per_day': 3800,
                'seats': 5,
                'fuel': 'PETROL',
                'transmission': 'AUTOMATIC',
                'ac': True,
                'location': 'Mumbai',
                'status': 'AVAILABLE',
                'features': 'Panoramic Sunroof,AI Assistant,Connected Car,Wireless CarPlay',
                'rating': 4.7,
                'reviews_count': 61,
            },
        ]

        created_count = 0
        for vdata in vehicles_data:
            _, created = Vehicle.objects.get_or_create(
                registration_number=vdata['registration_number'],
                defaults=vdata
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(
            'Seeding complete!\n'
            '   Vendors: 2 (vendor1@transrentals.in / vendor123)\n'
            '   Customer: customer@transrentals.in / customer123\n'
            '   Admin: admin@transrentals.in / admin123\n'
            f'   Vehicles created: {created_count}\n'
        ))
