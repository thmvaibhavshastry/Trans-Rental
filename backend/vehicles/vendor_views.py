"""Vendor-specific vehicle views."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from vendors.permissions import IsVendor
from vendors.models import Vendor
from .models import Vehicle
from .serializers import VehicleSerializer, VehicleWriteSerializer


class VendorVehicleListView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        vehicles = Vehicle.objects.filter(vendor=vendor)
        serializer = VehicleSerializer(vehicles, many=True, context={'request': request})
        return Response({'results': serializer.data, 'count': vehicles.count()})

    def post(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VehicleWriteSerializer(data=request.data, context={'vendor': vendor})
        if serializer.is_valid():
            vehicle = serializer.save()
            return Response(
                VehicleSerializer(vehicle, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorVehicleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get_vehicle(self, pk, vendor):
        try:
            return Vehicle.objects.get(pk=pk, vendor=vendor)
        except Vehicle.DoesNotExist:
            return None

    def get(self, request, pk):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        vehicle = self.get_vehicle(pk, vendor)
        if not vehicle:
            return Response({'error': 'Vehicle not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = VehicleSerializer(vehicle, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        vehicle = self.get_vehicle(pk, vendor)
        if not vehicle:
            return Response({'error': 'Vehicle not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VehicleWriteSerializer(vehicle, data=request.data, partial=True)
        if serializer.is_valid():
            vehicle = serializer.save()
            return Response(VehicleSerializer(vehicle, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        vehicle = self.get_vehicle(pk, vendor)
        if not vehicle:
            return Response({'error': 'Vehicle not found.'}, status=status.HTTP_404_NOT_FOUND)
        vehicle.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
