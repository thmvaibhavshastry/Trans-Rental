"""URL configuration for transrentals project."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('vehicles.urls')),
    path('api/', include('bookings.urls')),
    path('api/vendors/', include('vendors.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
