"""Permission classes for TransRentals."""

from rest_framework.permissions import BasePermission


class IsVendor(BasePermission):
    """Allow access only to vendors."""
    message = 'Only vendors can perform this action.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'VENDOR')


class IsCustomer(BasePermission):
    """Allow access only to customers."""
    message = 'Only customers can perform this action.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CUSTOMER')


class IsAdminUser(BasePermission):
    """Allow access only to admins."""
    message = 'Only admins can perform this action.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')
