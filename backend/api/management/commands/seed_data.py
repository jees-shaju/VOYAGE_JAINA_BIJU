from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from api.models import (
    ServiceCategory, WorkerProfile, WorkerSkill,
    JobRequest, Quote, Booking, Review, VerificationRecord
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds realistic fictional demonstration data for SAMARTH platform.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting SAMARTH seed data generation...'))

        # 1. Create Service Categories
        categories_data = [
            {
                'name': 'Electrician',
                'slug': 'electrician',
                'icon': 'Zap',
                'description': 'Wiring repairs, switchboards, MCB fixes, appliance connections & lighting installations.',
                'base_price_min': Decimal('299.00'),
                'base_price_max': Decimal('1299.00'),
                'popular': True,
            },
            {
                'name': 'Plumber',
                'slug': 'plumber',
                'icon': 'Wrench',
                'description': 'Pipeline repairs, tap & mixer replacements, leakage detection, motor pumps & blockages.',
                'base_price_min': Decimal('349.00'),
                'base_price_max': Decimal('1499.00'),
                'popular': True,
            },
            {
                'name': 'Carpenter',
                'slug': 'carpenter',
                'icon': 'Hammer',
                'description': 'Furniture assembly, modular kitchen fittings, door hinges, locks & custom woodwork.',
                'base_price_min': Decimal('399.00'),
                'base_price_max': Decimal('1799.00'),
                'popular': True,
            },
            {
                'name': 'Appliance Repair',
                'slug': 'appliance-repair',
                'icon': 'Tv',
                'description': 'AC servicing, washing machines, refrigerators, microwaves & water purifiers.',
                'base_price_min': Decimal('449.00'),
                'base_price_max': Decimal('2199.00'),
                'popular': True,
            },
        ]

        categories = {}
        for cat_info in categories_data:
            cat, created = ServiceCategory.objects.get_or_create(
                slug=cat_info['slug'],
                defaults=cat_info
            )
            categories[cat.slug] = cat
        self.stdout.write(self.style.SUCCESS(f'Created/updated {len(categories)} service categories.'))

        # 2. Create Admin Account
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@samarth.in',
                'full_name': 'SAMARTH Admin Officer',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'locality': 'Bangalore Headquarters',
                'phone': '+91 98765 00001',
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        # 3. Create Customers
        customer_rohan, _ = User.objects.get_or_create(
            username='customer_rohan',
            defaults={
                'email': 'customer@samarth.in',
                'full_name': 'Rohan Sharma',
                'role': User.Role.CUSTOMER,
                'locality': 'Koramangala, Bangalore',
                'phone': '+91 98450 12345',
                'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            }
        )
        customer_rohan.set_password('customer123')
        customer_rohan.save()

        customer_priya, _ = User.objects.get_or_create(
            username='customer_priya',
            defaults={
                'email': 'priya@example.com',
                'full_name': 'Priya Patel',
                'role': User.Role.CUSTOMER,
                'locality': 'Indiranagar, Bangalore',
                'phone': '+91 98450 67890',
                'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            }
        )
        customer_priya.set_password('customer123')
        customer_priya.save()

        # 4. Create Workers
        workers_info = [
            {
                'username': 'worker_ramesh',
                'email': 'worker.electrician@samarth.in',
                'full_name': 'Ramesh Kumar',
                'title': 'Senior Certified Electrician & Wireman',
                'category_slug': 'electrician',
                'locality': 'Koramangala 4th Block, Bangalore',
                'lat': 12.9352,
                'lng': 77.6245,
                'radius': 15.0,
                'exp': 8,
                'rate': Decimal('400.00'),
                'status': WorkerProfile.VerificationStatus.VERIFIED,
                'phone': '+91 98111 22334',
                'id_num': 'XXXX-XXXX-8921',
                'skills': [
                    'Short Circuit & Tripping',
                    'Switchboard & MCB Installation',
                    'Inverter & Battery Setup',
                    'Ceiling Fan & Chandelier Fitting'
                ],
                'bio': 'Licensed industrial & domestic electrician with 8+ years experience. Known for safety-first approach and clean cable routing.'
            },
            {
                'username': 'worker_suresh',
                'email': 'worker.plumber@samarth.in',
                'full_name': 'Suresh Patel',
                'title': 'Master Sanitary & Pipe Fitting Plumber',
                'category_slug': 'plumber',
                'locality': 'Indiranagar 100ft Road, Bangalore',
                'lat': 12.9784,
                'lng': 77.6408,
                'radius': 12.0,
                'exp': 6,
                'rate': Decimal('350.00'),
                'status': WorkerProfile.VerificationStatus.VERIFIED,
                'phone': '+91 98222 33445',
                'id_num': 'XXXX-XXXX-4190',
                'skills': [
                    'Pipeline Leakage Repair',
                    'Tap & Mixer Valve Replacement',
                    'Water Motor & Pressure Pump',
                    'Drainage & Blockage Clearing'
                ],
                'bio': 'Expert plumber specializing in concealed pipe leak detection, bathroom fittings, and residential water pressure optimization.'
            },
            {
                'username': 'worker_manoj',
                'email': 'worker.carpenter@samarth.in',
                'full_name': 'Manoj Verma',
                'title': 'Custom Furniture & Woodwork Artisan',
                'category_slug': 'carpenter',
                'locality': 'HSR Layout Sector 2, Bangalore',
                'lat': 12.9121,
                'lng': 77.6446,
                'radius': 14.0,
                'exp': 9,
                'rate': Decimal('450.00'),
                'status': WorkerProfile.VerificationStatus.VERIFIED,
                'phone': '+91 98333 44556',
                'id_num': 'XXXX-XXXX-7324',
                'skills': [
                    'Door Lock & Concealed Hinge Repair',
                    'Custom Cabinetry & Shelving',
                    'Furniture Assembly (IKEA/UrbanLadder)',
                    'Modular Kitchen Fitting'
                ],
                'bio': 'Experienced wood craftsman with precision tools for flatpack assembly, door repairs, and bespoke wardrobe alterations.'
            },
            {
                'username': 'worker_amit',
                'email': 'worker.appliance@samarth.in',
                'full_name': 'Amit Singh',
                'title': 'Refrigeration & AC Diagnostic Specialist',
                'category_slug': 'appliance-repair',
                'locality': 'BTM Layout 2nd Stage, Bangalore',
                'lat': 12.9166,
                'lng': 77.6101,
                'radius': 12.0,
                'exp': 5,
                'rate': Decimal('400.00'),
                'status': WorkerProfile.VerificationStatus.VERIFIED,
                'phone': '+91 98444 55667',
                'id_num': 'XXXX-XXXX-9102',
                'skills': [
                    'AC Gas Refill & Cooling Service',
                    'Washing Machine PCB & Motor Repair',
                    'Microwave & Oven Servicing',
                    'Refrigerator Frosting & Compressor'
                ],
                'bio': 'Certified HVAC & home appliance technician trained in inverter ACs, front-load washing machines, and multi-door refrigerators.'
            },
            {
                'username': 'worker_dinesh',
                'email': 'dinesh@samarth.in',
                'full_name': 'Dinesh Yadav',
                'title': 'General Electrical Assistant & Wireman',
                'category_slug': 'electrician',
                'locality': 'Bellandur Green Glen, Bangalore',
                'lat': 12.9260,
                'lng': 77.6762,
                'radius': 8.0,
                'exp': 2,
                'rate': Decimal('280.00'),
                'status': WorkerProfile.VerificationStatus.PENDING,
                'phone': '+91 98555 66778',
                'id_num': 'XXXX-XXXX-3341',
                'skills': [
                    'Light Fixtures & Minor Wiring',
                    'Switchboard & MCB Installation'
                ],
                'bio': 'Keen young electrician eager to deliver quality home service. Document verification submitted for admin review.'
            }
        ]

        created_workers = {}
        for w in workers_info:
            user, _ = User.objects.get_or_create(
                username=w['username'],
                defaults={
                    'email': w['email'],
                    'full_name': w['full_name'],
                    'role': User.Role.WORKER,
                    'locality': w['locality'],
                    'phone': w['phone'],
                }
            )
            user.set_password('worker123')
            user.save()

            wp, _ = WorkerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'title': w['title'],
                    'bio': w['bio'],
                    'locality': w['locality'],
                    'latitude': w['lat'],
                    'longitude': w['lng'],
                    'service_radius_km': w['radius'],
                    'experience_years': w['exp'],
                    'hourly_rate': w['rate'],
                    'is_available': True,
                    'verification_status': w['status'],
                    'id_proof_number': w['id_num'],
                    'id_proof_type': 'Aadhaar Card'
                }
            )
            # Update fields in case existing
            wp.title = w['title']
            wp.verification_status = w['status']
            wp.hourly_rate = w['rate']
            wp.save()

            # Assign skills
            cat = categories[w['category_slug']]
            for skill_name in w['skills']:
                WorkerSkill.objects.get_or_create(
                    worker=wp,
                    category=cat,
                    skill_name=skill_name,
                    defaults={'experience_years': w['exp']}
                )

            # Verification record
            VerificationRecord.objects.get_or_create(
                worker=wp,
                id_type='Aadhaar Card',
                id_number_masked=w['id_num'],
                defaults={
                    'document_notes': f"ID proof and trade credentials for {w['full_name']}.",
                    'status': VerificationRecord.Status.APPROVED if w['status'] == WorkerProfile.VerificationStatus.VERIFIED else VerificationRecord.Status.PENDING,
                    'admin_remarks': 'Verified government identification and trade background.' if w['status'] == WorkerProfile.VerificationStatus.VERIFIED else 'Pending initial admin review.'
                }
            )

            created_workers[w['username']] = wp

        self.stdout.write(self.style.SUCCESS(f'Created {len(created_workers)} worker profiles with skills and verification records.'))

        # 5. Create Sample Job Requests & Workflows
        today = timezone.now().date()

        # Job 1: OPEN request (Electrician needed in Koramangala) - ready for customer matching testing!
        job_open, _ = JobRequest.objects.get_or_create(
            title='Main Kitchen MCB Tripping Under Load',
            customer=customer_rohan,
            defaults={
                'category': categories['electrician'],
                'description': 'The 16A MCB in the main switchboard frequently trips whenever the microwave and kettle run simultaneously. Needs diagnosis and load distribution.',
                'locality': 'Koramangala 5th Block, Bangalore',
                'latitude': 12.9352,
                'longitude': 77.6245,
                'preferred_date': today + timedelta(days=1),
                'preferred_time_slot': JobRequest.TimeSlot.MORNING,
                'budget_min': Decimal('400.00'),
                'budget_max': Decimal('1200.00'),
                'status': JobRequest.Status.OPEN,
                'reference_note': 'Flat 302, Green Glen Apartments. Elevator available.'
            }
        )

        # Job 2: QUOTED request (Plumbing issue with active quote submitted by Suresh)
        job_quoted, _ = JobRequest.objects.get_or_create(
            title='Concealed Shower Mixer Valve Leaking Water',
            customer=customer_priya,
            defaults={
                'category': categories['plumber'],
                'description': 'Continuous water drip behind the bathroom wall tile mixer valve. Low flow in the overhead shower as a result.',
                'locality': 'Indiranagar Defence Colony, Bangalore',
                'latitude': 12.9784,
                'longitude': 77.6408,
                'preferred_date': today + timedelta(days=2),
                'preferred_time_slot': JobRequest.TimeSlot.AFTERNOON,
                'budget_min': Decimal('500.00'),
                'budget_max': Decimal('1500.00'),
                'status': JobRequest.Status.QUOTED,
                'reference_note': 'Please bring replacement O-rings and ceramic cartridges if possible.'
            }
        )
        # Worker Suresh submitted quote for Job 2
        quote_suresh, _ = Quote.objects.get_or_create(
            job_request=job_quoted,
            worker=created_workers['worker_suresh'],
            defaults={
                'labour_cost': Decimal('550.00'),
                'materials_cost': Decimal('250.00'),
                'additional_cost': Decimal('50.00'),
                'total_amount': Decimal('850.00'),
                'estimated_hours': 2.0,
                'notes': 'Will dismantle the Jaguar mixer plate, inspect the cartridge spindle and replace worn gasket seal.',
                'status': Quote.Status.SUBMITTED
            }
        )

        # Job 3: BOOKED / CONFIRMED request (Carpenter Manoj Verma booked by Rohan)
        job_booked, _ = JobRequest.objects.get_or_create(
            title='Assembly of 3-Door Engineered Wood Wardrobe',
            customer=customer_rohan,
            defaults={
                'category': categories['carpenter'],
                'description': 'Flatpack delivery from Urban Ladder arrived today. Need assembly of 3-door wardrobe with two lower sliding drawers.',
                'locality': 'Koramangala 3rd Block, Bangalore',
                'latitude': 12.9350,
                'longitude': 77.6240,
                'preferred_date': today + timedelta(days=3),
                'preferred_time_slot': JobRequest.TimeSlot.MORNING,
                'budget_min': Decimal('800.00'),
                'budget_max': Decimal('1600.00'),
                'status': JobRequest.Status.BOOKED,
                'reference_note': 'Hardware box and instruction manual are sealed and intact.'
            }
        )
        quote_manoj, _ = Quote.objects.get_or_create(
            job_request=job_booked,
            worker=created_workers['worker_manoj'],
            defaults={
                'labour_cost': Decimal('1100.00'),
                'materials_cost': Decimal('0.00'),
                'additional_cost': Decimal('50.00'),
                'total_amount': Decimal('1150.00'),
                'estimated_hours': 3.5,
                'notes': 'Complete flatpack assembly using professional power screwdrivers and magnetic levelers.',
                'status': Quote.Status.ACCEPTED
            }
        )
        Booking.objects.get_or_create(
            job_request=job_booked,
            defaults={
                'quote': quote_manoj,
                'customer': customer_rohan,
                'worker': created_workers['worker_manoj'],
                'status': Booking.Status.CONFIRMED,
                'scheduled_date': today + timedelta(days=3),
                'scheduled_slot': 'Morning (8:00 AM - 12:00 PM)',
                'final_amount': Decimal('1150.00'),
            }
        )

        # Job 4: COMPLETED request with 5-star review (Appliance Repair by Amit Singh)
        job_completed, _ = JobRequest.objects.get_or_create(
            title='Inverter Split AC Jet Pump Cleaning & Diagnostics',
            customer=customer_rohan,
            defaults={
                'category': categories['appliance-repair'],
                'description': 'AC blower fan has dust accumulation, reduced cooling capacity and slight foul smell. Needs thorough jet pressure coil cleaning.',
                'locality': 'Koramangala 4th Block, Bangalore',
                'latitude': 12.9352,
                'longitude': 77.6245,
                'preferred_date': today - timedelta(days=4),
                'preferred_time_slot': JobRequest.TimeSlot.AFTERNOON,
                'budget_min': Decimal('600.00'),
                'budget_max': Decimal('1400.00'),
                'status': JobRequest.Status.COMPLETED,
            }
        )
        quote_amit, _ = Quote.objects.get_or_create(
            job_request=job_completed,
            worker=created_workers['worker_amit'],
            defaults={
                'labour_cost': Decimal('699.00'),
                'materials_cost': Decimal('150.00'),
                'additional_cost': Decimal('0.00'),
                'total_amount': Decimal('849.00'),
                'estimated_hours': 1.5,
                'notes': 'High-pressure foam jet wash of indoor cooling coil, filter disinfection, and gas pressure reading.',
                'status': Quote.Status.ACCEPTED
            }
        )
        booking_completed, _ = Booking.objects.get_or_create(
            job_request=job_completed,
            defaults={
                'quote': quote_amit,
                'customer': customer_rohan,
                'worker': created_workers['worker_amit'],
                'status': Booking.Status.COMPLETED,
                'scheduled_date': today - timedelta(days=4),
                'scheduled_slot': 'Afternoon (12:00 PM - 4:00 PM)',
                'final_amount': Decimal('849.00'),
                'started_at': timezone.now() - timedelta(days=4, hours=2),
                'completed_at': timezone.now() - timedelta(days=4),
            }
        )
        Review.objects.get_or_create(
            booking=booking_completed,
            defaults={
                'reviewer': customer_rohan,
                'reviewee': created_workers['worker_amit'].user,
                'rating': 5,
                'comment': 'Exceptional service! Arrived right on schedule with clean protective sheets. The AC cooling is back to brand-new condition without any water spillage.'
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all demonstration data across full lifecycle!'))
        self.stdout.write(self.style.NOTICE(
            "\nDemo Credentials:\n"
            "  Admin:    admin / admin123  (or admin@samarth.in)\n"
            "  Customer: customer_rohan / customer123  (or customer@samarth.in)\n"
            "  Worker:   worker_ramesh / worker123  (Electrician)\n"
            "  Worker:   worker_suresh / worker123  (Plumber)\n"
            "  Worker:   worker_manoj / worker123   (Carpenter)\n"
            "  Worker:   worker_amit / worker123    (Appliance Repair)\n"
        ))
