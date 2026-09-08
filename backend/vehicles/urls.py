"""URL patterns for vehicles app."""

from django.urls import path
from .views import VehicleListView, VehicleDetailView, CategoryListView

urlpatterns = [
    path('vehicles/', VehicleListView.as_view(), name='vehicle-list'),
    path('vehicles/categories/', CategoryListView.as_view(), name='category-list'),
    path('vehicles/<int:pk>/', VehicleDetailView.as_view(), name='vehicle-detail'),
]
