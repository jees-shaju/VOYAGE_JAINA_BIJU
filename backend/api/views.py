from decimal import Decimal
from django.utils import timezone
from django.db import models, transaction
from django.contrib.auth import authenticate, get_user_model
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import (
    ServiceCategory, WorkerProfile, WorkerSkill,
    JobRequest, Quote, Booking, Review, VerificationRecord
)
from .serializers import (
    UserSerializer, RegisterSerializer, ServiceCategorySerializer,
    WorkerProfileSerializer, WorkerSkillSerializer, JobRequestSerializer,
    QuoteSerializer, BookingSerializer, ReviewSerializer, VerificationRecordSerializer
)
from .permissions import IsAdminUserRole, IsWorkerUserRole, IsCustomerUserRole, IsOwnerOrAdmin
from .matching import find_matching_workers

User = get_user_model()


# ==========================================
# AUTH VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data
        return Response({
            'message': 'Registration successful',
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Allow login by username OR email
    user = authenticate(username=username, password=password)
    if not user:
        # Try matching by email
        email_user = User.objects.filter(email=username).first()
        if email_user:
            user = authenticate(username=email_user.username, password=password)

    if not user:
        return Response({'detail': 'Invalid credentials. Please verify your details.'}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'message': 'Login successful',
        'token': token.key,
        'user': UserSerializer(user).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    user = request.user
    data = UserSerializer(user).data
    if hasattr(user, 'worker_profile'):
        data['worker_profile'] = WorkerProfileSerializer(user.worker_profile).data
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully'})


# ==========================================
# SERVICE CATEGORIES VIEWSET
# ==========================================

class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]


# ==========================================
# WORKER PROFILE VIEWSET
# ==========================================

class WorkerProfileViewSet(viewsets.ModelViewSet):
    queryset = WorkerProfile.objects.select_related('user').prefetch_related('skills', 'skills__category').all()
    serializer_class = WorkerProfileSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'reviews']:
            return [permissions.AllowAny()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        if self.action in ['toggle_availability', 'my_profile']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        verified = self.request.query_params.get('verified')
        available = self.request.query_params.get('available')
        search = self.request.query_params.get('search')

        if category:
            qs = qs.filter(skills__category__slug=category).distinct()
        if verified == 'true':
            qs = qs.filter(verification_status=WorkerProfile.VerificationStatus.VERIFIED)
        if available == 'true':
            qs = qs.filter(is_available=True)
        if search:
            qs = qs.filter(
                models.Q(title__icontains=search) |
                models.Q(user__full_name__icontains=search) |
                models.Q(locality__icontains=search) |
                models.Q(skills__skill_name__icontains=search)
            ).distinct()

        return qs

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def my_profile(self, request):
        if not hasattr(request.user, 'worker_profile'):
            return Response({'detail': 'User is not registered as a worker.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(request.user.worker_profile)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'], permission_classes=[permissions.IsAuthenticated])
    def toggle_availability(self, request):
        if not hasattr(request.user, 'worker_profile'):
            return Response({'detail': 'Worker profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        profile = request.user.worker_profile
        profile.is_available = not profile.is_available
        profile.save()
        return Response({
            'status': 'success',
            'is_available': profile.is_available,
            'message': f"Availability status updated to {'Available' if profile.is_available else 'Busy / Unavailable'}."
        })

    @action(detail=True, methods=['GET'])
    def reviews(self, request, pk=None):
        worker = self.get_object()
        reviews = Review.objects.filter(reviewee=worker.user).select_related('reviewer')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)


# ==========================================
# JOB REQUEST VIEWSET
# ==========================================

class JobRequestViewSet(viewsets.ModelViewSet):
    serializer_class = JobRequestSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'matched_workers']:
            return [permissions.IsAuthenticated()]
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCustomerUserRole()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return JobRequest.objects.none()

        if user.role == User.Role.ADMIN or user.is_staff:
            return JobRequest.objects.all().select_related('customer', 'category')
        elif user.role == User.Role.WORKER:
            # Workers see open requests matching their skills / general area or requests where they quoted
            if hasattr(user, 'worker_profile'):
                worker_categories = user.worker_profile.skills.values_list('category', flat=True)
                return JobRequest.objects.filter(
                    category__in=worker_categories
                ).select_related('customer', 'category')
            return JobRequest.objects.none()
        else:
            # Customers see their own requests
            return JobRequest.objects.filter(customer=user).select_related('customer', 'category')

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['GET'])
    def matched_workers(self, request, pk=None):
        job_request = self.get_object()
        matches = find_matching_workers(job_request)

        results = []
        for m in matches:
            worker_data = WorkerProfileSerializer(m['worker']).data
            results.append({
                'worker': worker_data,
                'total_score': m['total_score'],
                'distance_km': m['distance_km'],
                'factor_scores': m['factor_scores'],
                'weights': m['weights'],
                'reasons': m['reasons']
            })

        return Response({
            'job_request_id': job_request.id,
            'category': job_request.category.name,
            'total_matches': len(results),
            'matches': results,
            'empty_state_suggestion': "No matching workers found for this exact criteria. Try broadening your budget range, picking another time slot, or checking nearby localities." if not results else None
        })


# ==========================================
# QUOTE VIEWSET
# ==========================================

class QuoteViewSet(viewsets.ModelViewSet):
    serializer_class = QuoteSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'approve']:
            return [permissions.IsAuthenticated()]
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsWorkerUserRole()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        job_id = self.request.query_params.get('job_request')

        qs = Quote.objects.select_related('job_request', 'worker', 'worker__user').all()

        if job_id:
            qs = qs.filter(job_request_id=job_id)

        if user.role == User.Role.ADMIN or user.is_staff:
            return qs
        elif user.role == User.Role.WORKER:
            if hasattr(user, 'worker_profile'):
                return qs.filter(worker=user.worker_profile)
            return Quote.objects.none()
        else:
            return qs.filter(job_request__customer=user)

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, 'worker_profile'):
            return Response({'detail': 'Only registered workers can submit quotes.'}, status=status.HTTP_403_FORBIDDEN)

        worker = request.user.worker_profile
        job_id = request.data.get('job_request')

        try:
            job_request = JobRequest.objects.get(id=job_id)
        except JobRequest.DoesNotExist:
            return Response({'detail': 'Job request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if job_request.status in [JobRequest.Status.BOOKED, JobRequest.Status.COMPLETED, JobRequest.Status.CANCELLED]:
            return Response({'detail': f'Cannot quote on a {job_request.status.lower()} job request.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if worker already submitted a quote for this job
        if Quote.objects.filter(job_request=job_request, worker=worker).exists():
            return Response({'detail': 'You have already submitted a quote for this job request.'}, status=status.HTTP_400_BAD_REQUEST)

        labour_cost = Decimal(str(request.data.get('labour_cost', 0)))
        materials_cost = Decimal(str(request.data.get('materials_cost', 0)))
        additional_cost = Decimal(str(request.data.get('additional_cost', 0)))
        notes = request.data.get('notes', '')
        estimated_hours = float(request.data.get('estimated_hours', 2.0))

        total_amount = labour_cost + materials_cost + additional_cost

        quote = Quote.objects.create(
            job_request=job_request,
            worker=worker,
            labour_cost=labour_cost,
            materials_cost=materials_cost,
            additional_cost=additional_cost,
            total_amount=total_amount,
            estimated_hours=estimated_hours,
            notes=notes,
            status=Quote.Status.SUBMITTED
        )

        # Update JobRequest status to QUOTED if currently OPEN
        if job_request.status == JobRequest.Status.OPEN:
            job_request.status = JobRequest.Status.QUOTED
            job_request.save()

        return Response(QuoteSerializer(quote).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['POST'])
    def approve(self, request, pk=None):
        quote = self.get_object()
        job_request = quote.job_request

        # Only the customer who created the job can approve quotes
        if job_request.customer != request.user and not request.user.is_staff:
            return Response({'detail': 'You are not authorized to approve quotes for this job.'}, status=status.HTTP_403_FORBIDDEN)

        if quote.status == Quote.Status.ACCEPTED:
            return Response({'detail': 'Quote is already accepted and booking confirmed.'}, status=status.HTTP_400_BAD_REQUEST)

        if job_request.status == JobRequest.Status.BOOKED:
            return Response({'detail': 'This job is already booked with a confirmed quote.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # 1. Accept this quote
            quote.status = Quote.Status.ACCEPTED
            quote.save()

            # 2. Reject other quotes for this job request
            Quote.objects.filter(job_request=job_request).exclude(id=quote.id).update(status=Quote.Status.REJECTED)

            # 3. Update job request status
            job_request.status = JobRequest.Status.BOOKED
            job_request.save()

            # 4. Create confirmed booking
            booking = Booking.objects.create(
                job_request=job_request,
                quote=quote,
                customer=job_request.customer,
                worker=quote.worker,
                status=Booking.Status.CONFIRMED,
                scheduled_date=job_request.preferred_date,
                scheduled_slot=job_request.get_preferred_time_slot_display(),
                final_amount=quote.total_amount
            )

        return Response({
            'status': 'success',
            'message': 'Quote approved! Booking confirmed successfully.',
            'booking_id': booking.id,
            'booking': BookingSerializer(booking).data
        })


# ==========================================
# BOOKING VIEWSET
# ==========================================

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'start_job', 'complete_job', 'cancel']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related(
            'job_request', 'quote', 'customer', 'worker', 'worker__user'
        ).all()

        if user.role == User.Role.ADMIN or user.is_staff:
            return qs
        elif user.role == User.Role.WORKER:
            if hasattr(user, 'worker_profile'):
                return qs.filter(worker=user.worker_profile)
            return Booking.objects.none()
        else:
            return qs.filter(customer=user)

    @action(detail=True, methods=['POST'])
    def start_job(self, request, pk=None):
        booking = self.get_object()

        # Only assigned worker or admin can start the job
        is_admin = request.user.role == User.Role.ADMIN or request.user.is_staff or request.user.is_superuser
        is_assigned_worker = (
            hasattr(request.user, 'worker_profile') and
            booking.worker == request.user.worker_profile
        )
        if is_assigned_worker or is_admin:
            if booking.status != Booking.Status.CONFIRMED:
                return Response({'detail': f'Cannot start job from current status: {booking.status}.'}, status=status.HTTP_400_BAD_REQUEST)

            booking.status = Booking.Status.IN_PROGRESS
            booking.started_at = timezone.now()
            booking.save()
            return Response(BookingSerializer(booking).data)

        return Response({'detail': 'Only the assigned worker can start this job.'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['POST'])
    def complete_job(self, request, pk=None):
        booking = self.get_object()

        # Both customer or worker can confirm completion
        is_participant = (
            booking.customer == request.user or
            (hasattr(request.user, 'worker_profile') and booking.worker == request.user.worker_profile) or
            request.user.role == User.Role.ADMIN or
            request.user.is_staff or
            request.user.is_superuser
        )
        if not is_participant:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in [Booking.Status.CONFIRMED, Booking.Status.IN_PROGRESS]:
            return Response({'detail': f'Cannot mark {booking.status.lower()} booking as completed.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            booking.status = Booking.Status.COMPLETED
            booking.completed_at = timezone.now()
            booking.save()

            booking.job_request.status = JobRequest.Status.COMPLETED
            booking.job_request.save()

        return Response({
            'status': 'success',
            'message': 'Service marked as completed successfully!',
            'booking': BookingSerializer(booking).data
        })

    @action(detail=True, methods=['POST'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        reason = request.data.get('reason', '').strip()

        is_participant = (
            booking.customer == request.user or
            (hasattr(request.user, 'worker_profile') and booking.worker == request.user.worker_profile) or
            request.user.role == User.Role.ADMIN or
            request.user.is_staff or
            request.user.is_superuser
        )
        if not is_participant:
            return Response({'detail': 'Not authorized to cancel this booking.'}, status=status.HTTP_403_FORBIDDEN)

        if booking.status in [Booking.Status.COMPLETED, Booking.Status.CANCELLED]:
            return Response({'detail': f'Cannot cancel a {booking.status.lower()} booking.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            booking.status = Booking.Status.CANCELLED
            booking.cancelled_at = timezone.now()
            booking.cancelled_by = request.user
            booking.cancellation_reason = reason or "Cancelled by participant."
            booking.save()

            booking.job_request.status = JobRequest.Status.CANCELLED
            booking.job_request.save()

        return Response({
            'status': 'success',
            'message': 'Booking cancelled successfully.',
            'booking': BookingSerializer(booking).data
        })


# ==========================================
# REVIEW VIEWSET
# ==========================================

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        return Review.objects.select_related('reviewer', 'reviewee').all()

    def create(self, request, *args, **kwargs):
        booking_id = request.data.get('booking')
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status != Booking.Status.COMPLETED:
            return Response({'detail': 'Reviews can only be submitted after job completion.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce one review per booking
        if hasattr(booking, 'review'):
            return Response({'detail': 'A review has already been submitted for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

        # Reviewer must be the customer or worker
        if request.user == booking.customer:
            reviewer = request.user
            reviewee = booking.worker.user
        elif hasattr(request.user, 'worker_profile') and booking.worker == request.user.worker_profile:
            reviewer = request.user
            reviewee = booking.customer
        else:
            return Response({'detail': 'Only direct participants of this booking can leave a review.'}, status=status.HTTP_403_FORBIDDEN)

        rating = int(request.data.get('rating', 5))
        comment = request.data.get('comment', '').strip()

        if rating < 1 or rating > 5:
            return Response({'detail': 'Rating must be between 1 and 5 stars.'}, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            booking=booking,
            reviewer=reviewer,
            reviewee=reviewee,
            rating=rating,
            comment=comment or "Good reliable service."
        )

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


# ==========================================
# ADMIN MANAGEMENT VIEWSET & STATS
# ==========================================

class AdminViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUserRole]

    @action(detail=False, methods=['GET'])
    def stats(self, request):
        total_users = User.objects.count()
        total_workers = WorkerProfile.objects.count()
        verified_workers = WorkerProfile.objects.filter(verification_status=WorkerProfile.VerificationStatus.VERIFIED).count()
        pending_workers = WorkerProfile.objects.filter(verification_status=WorkerProfile.VerificationStatus.PENDING).count()
        total_requests = JobRequest.objects.count()
        active_bookings = Booking.objects.filter(status__in=[Booking.Status.CONFIRMED, Booking.Status.IN_PROGRESS]).count()
        completed_bookings = Booking.objects.filter(status=Booking.Status.COMPLETED).count()
        cancelled_bookings = Booking.objects.filter(status=Booking.Status.CANCELLED).count()

        total_volume = Booking.objects.filter(status=Booking.Status.COMPLETED).aggregate(
            models.Sum('final_amount')
        )['final_amount__sum'] or Decimal('0.00')

        return Response({
            'total_users': total_users,
            'total_workers': total_workers,
            'verified_workers': verified_workers,
            'pending_verifications': pending_workers,
            'total_requests': total_requests,
            'active_bookings': active_bookings,
            'completed_bookings': completed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'total_volume': float(total_volume)
        })

    @action(detail=False, methods=['GET'])
    def verifications(self, request):
        records = VerificationRecord.objects.select_related(
            'worker', 'worker__user', 'reviewed_by'
        ).prefetch_related('worker__skills', 'worker__skills__category')
        serializer = VerificationRecordSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'])
    def verify_worker(self, request):
        worker_id = request.data.get('worker_id')
        action_decision = request.data.get('action')  # 'APPROVE' or 'REJECT'
        admin_remarks = request.data.get('remarks', '')

        try:
            worker = WorkerProfile.objects.get(id=worker_id)
        except WorkerProfile.DoesNotExist:
            return Response({'detail': 'Worker profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action_decision == 'APPROVE':
            worker.verification_status = WorkerProfile.VerificationStatus.VERIFIED
            worker.verification_notes = admin_remarks or 'Verified by platform admin.'
            record_status = VerificationRecord.Status.APPROVED
        elif action_decision == 'REJECT':
            worker.verification_status = WorkerProfile.VerificationStatus.REJECTED
            worker.verification_notes = admin_remarks or 'Verification rejected.'
            record_status = VerificationRecord.Status.REJECTED
        else:
            return Response({'detail': "Invalid action. Use 'APPROVE' or 'REJECT'."}, status=status.HTTP_400_BAD_REQUEST)

        worker.save()

        # Update or create verification record
        v_record = VerificationRecord.objects.filter(worker=worker).first()
        if v_record:
            v_record.status = record_status
            v_record.admin_remarks = admin_remarks
            v_record.reviewed_at = timezone.now()
            v_record.reviewed_by = request.user
            v_record.save()
        else:
            VerificationRecord.objects.create(
                worker=worker,
                id_type=worker.id_proof_type,
                id_number_masked=worker.id_proof_number or 'XXXX-XXXX-9999',
                status=record_status,
                admin_remarks=admin_remarks,
                reviewed_at=timezone.now(),
                reviewed_by=request.user
            )

        return Response({
            'status': 'success',
            'message': f"Worker {worker.user.full_name} status updated to {worker.verification_status}.",
            'worker': WorkerProfileSerializer(worker).data
        })


# ==========================================
# HEALTH CHECK VIEW
# ==========================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check_view(request):
    """
    Lightweight health check endpoint for Render / uptime monitoring.
    """
    return Response({
        'status': 'healthy',
        'service': 'samarth-api',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)

