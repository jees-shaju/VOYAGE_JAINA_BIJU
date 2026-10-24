from django.contrib import admin
from .models import (
    User, ServiceCategory, WorkerProfile, WorkerSkill,
    JobRequest, Quote, Booking, Review, VerificationRecord
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'full_name', 'email', 'role', 'phone', 'locality', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'full_name', 'email', 'phone')


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'base_price_min', 'base_price_max', 'popular')
    prepopulated_fields = {'slug': ('name',)}


class WorkerSkillInline(admin.TabularInline):
    model = WorkerSkill
    extra = 1


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'locality', 'hourly_rate', 'is_available', 'verification_status')
    list_filter = ('verification_status', 'is_available')
    search_fields = ('user__full_name', 'user__username', 'title', 'locality')
    inlines = [WorkerSkillInline]


@admin.register(JobRequest)
class JobRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'customer', 'category', 'locality', 'budget_min', 'budget_max', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'customer__full_name', 'locality')


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'job_request', 'worker', 'labour_cost', 'materials_cost', 'total_amount', 'status')
    list_filter = ('status',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'job_request', 'customer', 'worker', 'scheduled_date', 'final_amount', 'status')
    list_filter = ('status', 'scheduled_date')
    search_fields = ('customer__full_name', 'worker__user__full_name')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'reviewer', 'reviewee', 'rating', 'created_at')
    list_filter = ('rating',)


@admin.register(VerificationRecord)
class VerificationRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'worker', 'id_type', 'status', 'reviewed_by', 'submitted_at')
    list_filter = ('status', 'id_type')
