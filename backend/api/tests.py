from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.models import (
    ServiceCategory, WorkerProfile, WorkerSkill,
    JobRequest, Quote, Booking, Review, VerificationRecord
)
from api.matching import find_matching_workers, compute_distance_fit, compute_skill_fit

User = get_user_model()


class SamarthBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Categories
        self.cat_electrician = ServiceCategory.objects.create(
            name='Electrician', slug='electrician', description='Electrical services',
            base_price_min=300, base_price_max=1200
        )
        self.cat_plumber = ServiceCategory.objects.create(
            name='Plumber', slug='plumber', description='Plumbing services',
            base_price_min=350, base_price_max=1500
        )

        # Users
        self.customer = User.objects.create_user(
            username='test_customer', password='password123',
            full_name='Test Customer', role=User.Role.CUSTOMER, locality='Koramangala'
        )

        self.worker_user = User.objects.create_user(
            username='test_worker', password='password123',
            full_name='Ramesh Electrician', role=User.Role.WORKER, locality='Koramangala'
        )
        self.worker_profile = WorkerProfile.objects.create(
            user=self.worker_user, title='Senior Electrician',
            latitude=12.9352, longitude=77.6245, service_radius_km=10.0,
            experience_years=5, hourly_rate=Decimal('350.00'),
            verification_status=WorkerProfile.VerificationStatus.VERIFIED
        )
        WorkerSkill.objects.create(
            worker=self.worker_profile, category=self.cat_electrician,
            skill_name='Switchboard & MCB Repair', experience_years=5
        )

        self.admin = User.objects.create_user(
            username='test_admin', password='password123',
            full_name='Platform Admin', role=User.Role.ADMIN, is_staff=True
        )

        # Job Request
        self.today = timezone.now().date()
        self.job_request = JobRequest.objects.create(
            customer=self.customer,
            category=self.cat_electrician,
            title='MCB Sparking and Tripping',
            description='Kitchen MCB switchboard sparking when kettle is on',
            locality='Koramangala 4th Block',
            latitude=12.9360,
            longitude=77.6250,
            preferred_date=self.today + timedelta(days=1),
            preferred_time_slot=JobRequest.TimeSlot.MORNING,
            budget_min=Decimal('300.00'),
            budget_max=Decimal('1000.00')
        )

    def test_01_authentication_flow(self):
        # Register
        res = self.client.post('/api/auth/register/', {
            'username': 'new_customer',
            'password': 'password123',
            'full_name': 'New Customer',
            'role': 'CUSTOMER',
            'locality': 'Indiranagar'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)

        # Login
        login_res = self.client.post('/api/auth/login/', {
            'username': 'new_customer',
            'password': 'password123'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', login_res.data)

    def test_worker_registration_adds_custom_trade_category(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'custom_trade_worker',
            'password': 'password123',
            'full_name': 'Custom Trade Worker',
            'role': 'WORKER',
            'locality': 'Indiranagar',
            'trade_title': 'Solar Panel Installer',
            'category_name': 'Solar Installation'
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        category = ServiceCategory.objects.get(name='Solar Installation')
        worker = WorkerProfile.objects.get(user__username='custom_trade_worker')
        skill = WorkerSkill.objects.get(worker=worker, category=category)
        self.assertEqual(skill.skill_name, 'Solar Panel Installer')

    def test_admin_verification_list_includes_applicant_details(self):
        self.worker_user.email = 'worker@example.com'
        self.worker_user.phone = '+91 98765 43210'
        self.worker_user.save()
        self.worker_profile.bio = 'Experienced electrical technician'
        self.worker_profile.experience_years = 7
        self.worker_profile.hourly_rate = Decimal('475.00')
        self.worker_profile.save()
        WorkerSkill.objects.create(
            worker=self.worker_profile,
            category=self.cat_electrician,
            skill_name='Solar panel installation',
            experience_years=4
        )
        VerificationRecord.objects.create(
            worker=self.worker_profile,
            id_type='Government ID',
            id_number_masked='XXXX-1234',
            document_notes='ID submitted for review'
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.get('/api/admin-ops/verifications/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        applicant = response.data[0]
        self.assertEqual(applicant['worker_email'], 'worker@example.com')
        self.assertEqual(applicant['worker_phone'], '+91 98765 43210')
        self.assertEqual(applicant['worker_bio'], 'Experienced electrical technician')
        self.assertEqual(applicant['worker_experience_years'], 7)
        self.assertEqual(applicant['worker_hourly_rate'], '475.00')
        self.assertIn(
            'Solar panel installation',
            [skill['skill_name'] for skill in applicant['worker_skills']]
        )
        self.assertEqual(applicant['document_notes'], 'ID submitted for review')

    def test_02_fair_matching_algorithm(self):
        matches = find_matching_workers(self.job_request)
        self.assertTrue(len(matches) >= 1)
        top_match = matches[0]
        self.assertEqual(top_match['worker'].id, self.worker_profile.id)
        self.assertTrue(top_match['total_score'] > 70)
        self.assertIn('skill_fit', top_match['factor_scores'])
        self.assertIn('distance_fit', top_match['factor_scores'])
        self.assertIn('reasons', top_match)
        self.assertTrue(len(top_match['reasons']) > 0)

    def test_03_no_match_scenario(self):
        # Far away job outside service radius (e.g. 50km away)
        far_job = JobRequest.objects.create(
            customer=self.customer,
            category=self.cat_electrician,
            title='Far Away Wiring Work',
            description='Outside city bounds',
            locality='Remote Outskirts',
            latitude=13.5000,
            longitude=78.2000,
            preferred_date=self.today + timedelta(days=2),
            preferred_time_slot=JobRequest.TimeSlot.EVENING,
            budget_min=Decimal('200.00'),
            budget_max=Decimal('500.00')
        )
        matches = find_matching_workers(far_job)
        self.assertEqual(len(matches), 0)

    def test_04_quote_submission_and_approval_workflow(self):
        # Worker logs in and submits quote
        self.client.force_authenticate(user=self.worker_user)
        quote_res = self.client.post('/api/quotes/', {
            'job_request': self.job_request.id,
            'labour_cost': '450.00',
            'materials_cost': '150.00',
            'additional_cost': '0.00',
            'notes': 'Diagnose MCB and replace 16A breaker.'
        })
        self.assertEqual(quote_res.status_code, status.HTTP_201_CREATED)
        quote_id = quote_res.data['id']
        self.assertEqual(float(quote_res.data['total_amount']), 600.0)

        # JobRequest status transitioned to QUOTED
        self.job_request.refresh_from_db()
        self.assertEqual(self.job_request.status, JobRequest.Status.QUOTED)

        # Customer logs in and approves quote
        self.client.force_authenticate(user=self.customer)
        approve_res = self.client.post(f'/api/quotes/{quote_id}/approve/')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        # Verify Booking created in CONFIRMED state
        self.job_request.refresh_from_db()
        self.assertEqual(self.job_request.status, JobRequest.Status.BOOKED)
        booking = Booking.objects.get(job_request=self.job_request)
        self.assertEqual(booking.status, Booking.Status.CONFIRMED)
        self.assertEqual(booking.final_amount, Decimal('600.00'))

    def test_05_booking_lifecycle_and_review(self):
        # Create quote & booking
        quote = Quote.objects.create(
            job_request=self.job_request,
            worker=self.worker_profile,
            labour_cost=Decimal('500.00'),
            total_amount=Decimal('500.00'),
            status=Quote.Status.ACCEPTED
        )
        booking = Booking.objects.create(
            job_request=self.job_request,
            quote=quote,
            customer=self.customer,
            worker=self.worker_profile,
            status=Booking.Status.CONFIRMED,
            scheduled_date=self.today + timedelta(days=1),
            scheduled_slot='Morning (8:00 AM - 12:00 PM)',
            final_amount=Decimal('500.00')
        )

        # Worker starts job
        self.client.force_authenticate(user=self.worker_user)
        start_res = self.client.post(f'/api/bookings/{booking.id}/start_job/')
        self.assertEqual(start_res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.IN_PROGRESS)

        # Complete job
        complete_res = self.client.post(f'/api/bookings/{booking.id}/complete_job/')
        self.assertEqual(complete_res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.COMPLETED)

        # Customer leaves review
        self.client.force_authenticate(user=self.customer)
        review_res = self.client.post('/api/reviews/', {
            'booking': booking.id,
            'rating': 5,
            'comment': 'Solved the circuit tripping issue quickly and cleanly.'
        })
        self.assertEqual(review_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.filter(booking=booking).count(), 1)

        # Second review on same booking should be rejected (prevent duplicate)
        dup_res = self.client.post('/api/reviews/', {
            'booking': booking.id,
            'rating': 4,
            'comment': 'Duplicate review attempt.'
        })
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_06_admin_verification_workflow(self):
        # Create pending worker
        pending_user = User.objects.create_user(
            username='pending_worker', password='password123',
            role=User.Role.WORKER, full_name='Pending Worker'
        )
        pending_profile = WorkerProfile.objects.create(
            user=pending_user, title='Junior Carpenter',
            verification_status=WorkerProfile.VerificationStatus.PENDING
        )

        # Admin logs in to verify
        self.client.force_authenticate(user=self.admin)
        verify_res = self.client.post('/api/admin-ops/verify_worker/', {
            'worker_id': pending_profile.id,
            'action': 'APPROVE',
            'remarks': 'Valid Aadhaar and apprentice trade license verified.'
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        pending_profile.refresh_from_db()
        self.assertEqual(pending_profile.verification_status, WorkerProfile.VerificationStatus.VERIFIED)

    def test_07_cancellation_workflow(self):
        quote = Quote.objects.create(
            job_request=self.job_request,
            worker=self.worker_profile,
            labour_cost=Decimal('500.00'),
            total_amount=Decimal('500.00'),
            status=Quote.Status.ACCEPTED
        )
        booking = Booking.objects.create(
            job_request=self.job_request,
            quote=quote,
            customer=self.customer,
            worker=self.worker_profile,
            status=Booking.Status.CONFIRMED,
            scheduled_date=self.today + timedelta(days=1),
            scheduled_slot='Morning',
            final_amount=Decimal('500.00')
        )
        # Customer cancels
        self.client.force_authenticate(user=self.customer)
        cancel_res = self.client.post(f'/api/bookings/{booking.id}/cancel/', {
            'reason': 'Unexpected travel, rescheduling later.'
        })
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CANCELLED)
        self.assertEqual(booking.cancelled_by, self.customer)
        self.assertEqual(booking.cancellation_reason, 'Unexpected travel, rescheduling later.')

    def test_08_public_registration_cannot_create_admin(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'self_promoted_admin',
            'password': 'password123',
            'role': User.Role.ADMIN
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='self_promoted_admin').exists())

    def test_09_customer_cannot_edit_another_worker_profile(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            f'/api/workers/{self.worker_profile.id}/',
            {'hourly_rate': '1.00'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.worker_profile.refresh_from_db()
        self.assertEqual(self.worker_profile.hourly_rate, Decimal('350.00'))

        self.client.force_authenticate(user=self.admin)
        admin_response = self.client.patch(
            f'/api/workers/{self.worker_profile.id}/',
            {'bio': 'Reviewed by platform administration.'},
            format='json'
        )
        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)

    def test_10_worker_cannot_edit_customer_job_request(self):
        self.client.force_authenticate(user=self.worker_user)

        response = self.client.patch(
            f'/api/job-requests/{self.job_request.id}/',
            {'title': 'Changed by worker'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.job_request.refresh_from_db()
        self.assertEqual(self.job_request.title, 'MCB Sparking and Tripping')

    def test_11_customer_cannot_edit_worker_quote(self):
        quote = Quote.objects.create(
            job_request=self.job_request,
            worker=self.worker_profile,
            labour_cost=Decimal('500.00'),
            total_amount=Decimal('500.00'),
            status=Quote.Status.SUBMITTED
        )
        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            f'/api/quotes/{quote.id}/',
            {'labour_cost': '1.00'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        quote.refresh_from_db()
        self.assertEqual(quote.labour_cost, Decimal('500.00'))

    def test_12_customer_cannot_edit_booking_lifecycle_directly(self):
        quote = Quote.objects.create(
            job_request=self.job_request,
            worker=self.worker_profile,
            labour_cost=Decimal('500.00'),
            total_amount=Decimal('500.00'),
            status=Quote.Status.ACCEPTED
        )
        booking = Booking.objects.create(
            job_request=self.job_request,
            quote=quote,
            customer=self.customer,
            worker=self.worker_profile,
            status=Booking.Status.CONFIRMED,
            scheduled_date=self.today + timedelta(days=1),
            scheduled_slot='Morning',
            final_amount=Decimal('500.00')
        )
        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            f'/api/bookings/{booking.id}/',
            {'status': Booking.Status.COMPLETED, 'final_amount': '1.00'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CONFIRMED)
        self.assertEqual(booking.final_amount, Decimal('500.00'))

    def test_13_customer_cannot_delete_review(self):
        review = Review.objects.create(
            booking=Booking.objects.create(
                job_request=self.job_request,
                quote=Quote.objects.create(
                    job_request=self.job_request,
                    worker=self.worker_profile,
                    labour_cost=Decimal('500.00'),
                    total_amount=Decimal('500.00'),
                    status=Quote.Status.ACCEPTED
                ),
                customer=self.customer,
                worker=self.worker_profile,
                status=Booking.Status.COMPLETED,
                scheduled_date=self.today + timedelta(days=1),
                scheduled_slot='Morning',
                final_amount=Decimal('500.00')
            ),
            reviewer=self.customer,
            reviewee=self.worker_user,
            rating=5,
            comment='Completed successfully.'
        )
        self.client.force_authenticate(user=self.customer)

        response = self.client.delete(f'/api/reviews/{review.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Review.objects.filter(id=review.id).exists())
