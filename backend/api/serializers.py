from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from .models import (
    ServiceCategory, WorkerProfile, WorkerSkill,
    JobRequest, Quote, Booking, Review, VerificationRecord
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    worker_profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'full_name',
            'phone', 'avatar_url', 'locality', 'worker_profile_id'
        ]
        read_only_fields = ['id', 'worker_profile_id']

    def get_worker_profile_id(self, obj):
        if hasattr(obj, 'worker_profile'):
            return obj.worker_profile.id
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(
        choices=[
            (User.Role.CUSTOMER, User.Role.CUSTOMER.label),
            (User.Role.WORKER, User.Role.WORKER.label),
        ],
        default=User.Role.CUSTOMER,
    )
    trade_title = serializers.CharField(required=False, allow_blank=True, write_only=True)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, write_only=True)
    category_id = serializers.IntegerField(required=False, write_only=True)
    category_name = serializers.CharField(max_length=100, required=False, write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'role',
            'full_name', 'phone', 'locality', 'trade_title',
            'hourly_rate', 'category_id', 'category_name'
        ]

    def validate(self, attrs):
        if attrs.get('category_id') and attrs.get('category_name', '').strip():
            raise serializers.ValidationError('Choose an existing trade or enter a new one, not both.')
        return attrs

    def create(self, validated_data):
        trade_title = validated_data.pop('trade_title', '')
        hourly_rate = validated_data.pop('hourly_rate', 350.00)
        category_id = validated_data.pop('category_id', None)
        category_name = validated_data.pop('category_name', '').strip()
        password = validated_data.pop('password')

        with transaction.atomic():
            user = User.objects.create_user(
                password=password,
                **validated_data
            )
            if user.role == User.Role.WORKER:
                wp = WorkerProfile.objects.create(
                    user=user,
                    title=trade_title or 'Skilled Professional',
                    locality=user.locality or 'Bangalore Central',
                    hourly_rate=hourly_rate or 350.00,
                    verification_status=WorkerProfile.VerificationStatus.PENDING,
                    bio=f"Experienced {trade_title or 'tradesperson'} dedicated to high-quality work."
                )
                category = None
                if category_name:
                    category = ServiceCategory.objects.filter(name__iexact=category_name).first()
                    if category is None:
                        base_slug = slugify(category_name) or 'custom-trade'
                        slug = base_slug[:100]
                        suffix = 2
                        while ServiceCategory.objects.filter(slug=slug).exists():
                            suffix_text = f'-{suffix}'
                            slug = f'{base_slug[:100 - len(suffix_text)]}{suffix_text}'
                            suffix += 1
                        category = ServiceCategory.objects.create(
                            name=category_name,
                            slug=slug,
                            description=f'Professional {category_name} services.'
                        )
                elif category_id:
                    category = ServiceCategory.objects.filter(id=category_id).first()

                if category:
                    WorkerSkill.objects.create(
                        worker=wp,
                        category=category,
                        skill_name=trade_title or category.name,
                        experience_years=3
                    )
                # Create initial verification record
                VerificationRecord.objects.create(
                    worker=wp,
                    id_type='Aadhaar Card',
                    id_number_masked='XXXX-XXXX-4589',
                    document_notes='Standard registration verification pending admin review.'
                )
            return user


class ServiceCategorySerializer(serializers.ModelSerializer):
    worker_count = serializers.SerializerMethodField()

    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon',
            'base_price_min', 'base_price_max', 'popular', 'worker_count'
        ]

    def get_worker_count(self, obj):
        return WorkerSkill.objects.filter(category=obj).values('worker').distinct().count()


class WorkerSkillSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = WorkerSkill
        fields = ['id', 'category', 'category_name', 'skill_name', 'experience_years']


class WorkerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    skills = WorkerSkillSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    total_reviews_count = serializers.IntegerField(read_only=True)
    completed_jobs_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = WorkerProfile
        fields = [
            'id', 'user', 'title', 'bio', 'locality', 'latitude', 'longitude',
            'service_radius_km', 'experience_years', 'hourly_rate',
            'is_available', 'verification_status', 'verification_notes',
            'id_proof_type', 'id_proof_number', 'skills', 'average_rating',
            'total_reviews_count', 'completed_jobs_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'verification_status', 'average_rating', 'total_reviews_count', 'completed_jobs_count']


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)
    reviewer_avatar = serializers.CharField(source='reviewer.avatar_url', read_only=True)
    reviewee_name = serializers.CharField(source='reviewee.full_name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'booking', 'reviewer', 'reviewer_name', 'reviewer_avatar',
            'reviewee', 'reviewee_name', 'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'reviewer', 'reviewer_name', 'reviewee_name']


class JobRequestSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(), source='category', write_only=True
    )
    quotes_count = serializers.SerializerMethodField()
    booking_id = serializers.SerializerMethodField()

    class Meta:
        model = JobRequest
        fields = [
            'id', 'customer', 'category', 'category_id', 'title', 'description',
            'locality', 'latitude', 'longitude', 'preferred_date', 'preferred_time_slot',
            'budget_min', 'budget_max', 'status', 'reference_note', 'created_at',
            'quotes_count', 'booking_id'
        ]
        read_only_fields = ['id', 'customer', 'status', 'created_at', 'quotes_count', 'booking_id']

    def get_quotes_count(self, obj):
        return obj.quotes.count()

    def get_booking_id(self, obj):
        return getattr(getattr(obj, 'booking', None), 'id', None)


class QuoteSerializer(serializers.ModelSerializer):
    worker = WorkerProfileSerializer(read_only=True)
    worker_id = serializers.PrimaryKeyRelatedField(
        queryset=WorkerProfile.objects.all(), source='worker', write_only=True, required=False
    )
    job_title = serializers.CharField(source='job_request.title', read_only=True)
    customer_name = serializers.CharField(source='job_request.customer.full_name', read_only=True)
    customer_locality = serializers.CharField(source='job_request.locality', read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id', 'job_request', 'worker', 'worker_id', 'job_title', 'customer_name',
            'customer_locality', 'labour_cost', 'materials_cost', 'additional_cost',
            'total_amount', 'estimated_hours', 'notes', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'worker', 'status', 'created_at', 'total_amount']


class BookingSerializer(serializers.ModelSerializer):
    job_request = JobRequestSerializer(read_only=True)
    quote = QuoteSerializer(read_only=True)
    customer = UserSerializer(read_only=True)
    worker = WorkerProfileSerializer(read_only=True)
    review = ReviewSerializer(read_only=True)
    cancelled_by_name = serializers.CharField(source='cancelled_by.full_name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'job_request', 'quote', 'customer', 'worker', 'status',
            'scheduled_date', 'scheduled_slot', 'final_amount', 'created_at',
            'started_at', 'completed_at', 'cancelled_at', 'cancelled_by',
            'cancelled_by_name', 'cancellation_reason', 'review'
        ]
        read_only_fields = [
            'id', 'created_at', 'started_at', 'completed_at',
            'cancelled_at', 'cancelled_by', 'review'
        ]


class VerificationRecordSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.user.full_name', read_only=True)
    worker_title = serializers.CharField(source='worker.title', read_only=True)
    worker_locality = serializers.CharField(source='worker.locality', read_only=True)
    worker_email = serializers.EmailField(source='worker.user.email', read_only=True)
    worker_phone = serializers.CharField(source='worker.user.phone', read_only=True)
    worker_bio = serializers.CharField(source='worker.bio', read_only=True)
    worker_experience_years = serializers.IntegerField(source='worker.experience_years', read_only=True)
    worker_hourly_rate = serializers.DecimalField(
        source='worker.hourly_rate', max_digits=8, decimal_places=2, read_only=True
    )
    worker_skills = WorkerSkillSerializer(source='worker.skills', many=True, read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:
        model = VerificationRecord
        fields = [
            'id', 'worker', 'worker_name', 'worker_title', 'worker_locality',
            'worker_email', 'worker_phone', 'worker_bio', 'worker_experience_years',
            'worker_hourly_rate', 'worker_skills', 'id_type', 'id_number_masked',
            'document_notes', 'status',
            'admin_remarks', 'submitted_at', 'reviewed_at', 'reviewed_by_name'
        ]
        read_only_fields = ['id', 'submitted_at', 'reviewed_at', 'reviewed_by_name']
