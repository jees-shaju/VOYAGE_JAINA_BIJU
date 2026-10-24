from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register_view, login_view, current_user_view, logout_view,
    ServiceCategoryViewSet, WorkerProfileViewSet, JobRequestViewSet,
    QuoteViewSet, BookingViewSet, ReviewViewSet, AdminViewSet
)

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='category')
router.register(r'workers', WorkerProfileViewSet, basename='worker')
router.register(r'job-requests', JobRequestViewSet, basename='job-request')
router.register(r'quotes', QuoteViewSet, basename='quote')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'admin-ops', AdminViewSet, basename='admin-ops')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', register_view, name='auth-register'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/me/', current_user_view, name='auth-me'),
    path('auth/logout/', logout_view, name='auth-logout'),

    # Viewset endpoints
    path('', include(router.urls)),
]
