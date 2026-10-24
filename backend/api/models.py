import math
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        WORKER = 'WORKER', 'Worker'
        ADMIN = 'ADMIN', 'Admin'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    locality = models.CharField(max_length=200, blank=True)

    def save(self, *args, **kwargs):
        if not self.full_name:
            self.full_name = f"{self.first_name} {self.last_name}".strip() or self.username
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name or self.username} ({self.role})"


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='Wrench')
    base_price_min = models.DecimalField(max_digits=8, decimal_places=2, default=299.00)
    base_price_max = models.DecimalField(max_digits=8, decimal_places=2, default=1499.00)
    popular = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class WorkerProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='worker_profile')
    title = models.CharField(max_length=200, default='Skilled Professional')
    bio = models.TextField(blank=True)
    locality = models.CharField(max_length=200, default='Central Area')
    latitude = models.FloatField(default=12.9716)
    longitude = models.FloatField(default=77.5946)
    service_radius_km = models.FloatField(default=12.0)
    experience_years = models.PositiveIntegerField(default=3)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=350.00)
    is_available = models.BooleanField(default=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    verification_notes = models.TextField(blank=True)
    id_proof_type = models.CharField(max_length=50, default='Aadhaar Card')
    id_proof_number = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name or self.user.username} - {self.title}"

    @property
    def average_rating(self):
        avg = Review.objects.filter(reviewee=self.user).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 4.8  # Default initial trustworthy score for verified workers

    @property
    def total_reviews_count(self):
        return Review.objects.filter(reviewee=self.user).count()

    @property
    def completed_jobs_count(self):
        return Booking.objects.filter(worker=self, status=Booking.Status.COMPLETED).count()

    def calculate_distance_km(self, target_lat, target_lng):
        """Haversine formula distance calculation in kilometers"""
        r = 6371.0  # Earth's radius in km
        lat1 = math.radians(self.latitude)
        lon1 = math.radians(self.longitude)
        lat2 = math.radians(target_lat)
        lon2 = math.radians(target_lng)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(r * c, 1)


class WorkerSkill(models.Model):
    worker = models.ForeignKey(WorkerProfile, related_name='skills', on_delete=models.CASCADE)
    category = models.ForeignKey(ServiceCategory, related_name='worker_skills', on_delete=models.CASCADE)
    skill_name = models.CharField(max_length=150)
    experience_years = models.PositiveIntegerField(default=2)

    class Meta:
        unique_together = ('worker', 'category', 'skill_name')

    def __str__(self):
        return f"{self.worker.user.full_name} - {self.skill_name}"


class JobRequest(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open for Quotes'
        QUOTED = 'QUOTED', 'Quote Received'
        BOOKED = 'BOOKED', 'Booked'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class TimeSlot(models.TextChoices):
        MORNING = 'MORNING', 'Morning (8:00 AM - 12:00 PM)'
        AFTERNOON = 'AFTERNOON', 'Afternoon (12:00 PM - 4:00 PM)'
        EVENING = 'EVENING', 'Evening (4:00 PM - 8:00 PM)'
        ANYTIME = 'ANYTIME', 'Flexible / Anytime'

    customer = models.ForeignKey(User, related_name='job_requests', on_delete=models.CASCADE)
    category = models.ForeignKey(ServiceCategory, related_name='job_requests', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    locality = models.CharField(max_length=200)
    latitude = models.FloatField(default=12.9716)
    longitude = models.FloatField(default=77.5946)
    preferred_date = models.DateField()
    preferred_time_slot = models.CharField(max_length=20, choices=TimeSlot.choices, default=TimeSlot.MORNING)
    budget_min = models.DecimalField(max_digits=8, decimal_places=2, default=300.00)
    budget_max = models.DecimalField(max_digits=8, decimal_places=2, default=1500.00)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    reference_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.id} {self.title} by {self.customer.full_name}"


class Quote(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'

    job_request = models.ForeignKey(JobRequest, related_name='quotes', on_delete=models.CASCADE)
    worker = models.ForeignKey(WorkerProfile, related_name='quotes', on_delete=models.CASCADE)
    labour_cost = models.DecimalField(max_digits=8, decimal_places=2)
    materials_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    additional_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    estimated_hours = models.FloatField(default=2.0)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job_request', 'worker')
        ordering = ['total_amount']

    def save(self, *args, **kwargs):
        # Auto-compute total if not set
        computed = (self.labour_cost or 0) + (self.materials_cost or 0) + (self.additional_cost or 0)
        if not self.total_amount:
            self.total_amount = computed
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Quote #{self.id} for Job #{self.job_request.id} - ₹{self.total_amount}"


class Booking(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    job_request = models.OneToOneField(JobRequest, related_name='booking', on_delete=models.CASCADE)
    quote = models.OneToOneField(Quote, related_name='booking', on_delete=models.CASCADE)
    customer = models.ForeignKey(User, related_name='customer_bookings', on_delete=models.CASCADE)
    worker = models.ForeignKey(WorkerProfile, related_name='worker_bookings', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CONFIRMED)
    scheduled_date = models.DateField()
    scheduled_slot = models.CharField(max_length=50)
    final_amount = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='cancelled_bookings'
    )
    cancellation_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking #{self.id} - {self.job_request.title} ({self.status})"


class Review(models.Model):
    booking = models.OneToOneField(Booking, related_name='review', on_delete=models.CASCADE)
    reviewer = models.ForeignKey(User, related_name='reviews_given', on_delete=models.CASCADE)
    reviewee = models.ForeignKey(User, related_name='reviews_received', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review #{self.id} - {self.rating} stars for {self.reviewee.full_name}"


class VerificationRecord(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    worker = models.ForeignKey(WorkerProfile, related_name='verification_records', on_delete=models.CASCADE)
    id_type = models.CharField(max_length=50, default='Government ID')
    id_number_masked = models.CharField(max_length=50)
    document_notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    admin_remarks = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='verifications_conducted'
    )

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Verification for {self.worker.user.full_name} ({self.status})"
