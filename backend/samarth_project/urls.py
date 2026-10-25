from django.contrib import admin
from django.urls import path, include
from api.views import health_check_view

urlpatterns = [
    path('healthz', health_check_view, name='root-health'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
