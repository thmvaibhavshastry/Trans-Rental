import requests
from datetime import datetime, timedelta
import time

API_URL = "http://localhost:8000/api"
AUTH_URL = f"{API_URL}/auth"

def print_result(name, success, error=""):
    status = "PASS" if success else "FAIL"
    print(f"[{status}] {name} {error}")
    if not success:
        print(f"   Details: {error}")

def run_tests():
    print("Starting End-to-End Acceptance Tests...\n")
    timestamp = int(time.time())
    cust_email = f"testcust_{timestamp}@example.com"
    vend_email = f"testvendor_{timestamp}@example.com"
    
    # ---------------------------------------------------------
    # CUSTOMER FLOW
    # ---------------------------------------------------------
    
    # 1. Register a new customer
    cust_data = {
        "name": "Test Customer",
        "email": cust_email,
        "phone": "9876543210",
        "password": "password123",
        "confirm_password": "password123",
        "role": "CUSTOMER"
    }
    res = requests.post(f"{AUTH_URL}/register/", json=cust_data)
    success = res.status_code == 201
    print_result("Register new customer", success, res.text if not success else "")

    # 2. Login
    res = requests.post(f"{AUTH_URL}/login/", json={"email": cust_email, "password": "password123"})
    if res.status_code == 200:
        cust_token = res.json()["access"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}
        print_result("Customer Login", True)
    else:
        print_result("Customer Login", False, res.text)
        return

    # 3. Search for vehicles
    res = requests.get(f"{API_URL}/vehicles/?category=CAR")
    if res.status_code == 200 and len(res.json()["results"]) > 0:
        vehicles = res.json()["results"]
        vehicle_id = vehicles[0]["id"]
        vehicle_price = float(vehicles[0]["price_per_day"])
        print_result("Search for vehicles", True)
    else:
        print_result("Search for vehicles", False, "No vehicles found")
        return

    # 4. Open vehicle details page
    res = requests.get(f"{API_URL}/vehicles/{vehicle_id}/")
    print_result("Vehicle details page", res.status_code == 200)

    # 5 & 6. Select dates and Create a booking
    pickup = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    return_date = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
    booking_data = {
        "vehicle_id": vehicle_id,
        "customer_name": "Test Customer",
        "customer_phone": "9876543210",
        "customer_email": cust_email,
        "pickup_location": "Test Location",
        "pickup_date": pickup,
        "return_date": return_date
    }
    res = requests.post(f"{API_URL}/bookings/", json=booking_data, headers=cust_headers)
    if res.status_code == 201:
        booking = res.json()
        booking_id = booking["id"]
        print_result("Create a booking", True)
    else:
        print_result("Create a booking", False, res.text)
        return

    # 8. Verify booking appears in customer dashboard
    res = requests.get(f"{API_URL}/bookings/", headers=cust_headers)
    if res.status_code == 200:
        bookings = res.json()["results"]
        found = any(b["id"] == booking_id for b in bookings)
        print_result("Booking in customer dashboard", found)
    else:
        print_result("Booking in customer dashboard", False)

    # 9. Verify booking status and price calculation
    rental = vehicle_price * 3
    tax = round(rental * 0.18, 2)
    expected_total = rental + tax
    status_ok = booking["status"] == "CONFIRMED"
    price_ok = float(booking["total_amount"]) == expected_total
    print_result("Booking status and price calculation", status_ok and price_ok, f"Expected {expected_total}, got {booking['total_amount']}")

    # ---------------------------------------------------------
    # VENDOR FLOW
    # ---------------------------------------------------------
    
    # Register a new vendor just for testing
    vendor_data = {
        "name": "Test Vendor",
        "email": vend_email,
        "phone": "9876543211",
        "password": "password123",
        "confirm_password": "password123",
        "role": "VENDOR"
    }
    res = requests.post(f"{AUTH_URL}/register/", json=vendor_data)
    print_result("Register new vendor", res.status_code == 201, res.text if res.status_code != 201 else "")

    # 1. Login as a vendor
    res = requests.post(f"{AUTH_URL}/login/", json={"email": vend_email, "password": "password123"})
    if res.status_code == 200:
        vend_token = res.json()["access"]
        vend_headers = {"Authorization": f"Bearer {vend_token}"}
        print_result("Vendor Login", True)
    else:
        print_result("Vendor Login", False, res.text)
        return

    # 2. Open vendor dashboard
    res = requests.get(f"{API_URL}/vendors/dashboard/", headers=vend_headers)
    print_result("Vendor dashboard", res.status_code == 200, res.text)

    # 3. Add a new vehicle
    new_vehicle = {
        "name": "Test Vendor Car",
        "category": "CAR",
        "brand": "TestBrand",
        "model": "TestModel",
        "registration_number": f"TEST{timestamp}",
        "price_per_day": "2000.00",
        "seats": 5,
        "fuel": "PETROL",
        "transmission": "MANUAL",
        "ac": True,
        "location": "Test City",
        "status": "AVAILABLE"
    }
    res = requests.post(f"{API_URL}/vendors/vehicles/", json=new_vehicle, headers=vend_headers)
    if res.status_code == 201:
        new_vehicle_id = res.json()["id"]
        print_result("Add a new vehicle", True)
    else:
        print_result("Add a new vehicle", False, res.text)
        return

    # 5. Verify vehicle appears in customer listing
    res = requests.get(f"{API_URL}/vehicles/?search=TestBrand")
    if res.status_code == 200:
        v_list = res.json()["results"]
        found = any(v["id"] == new_vehicle_id for v in v_list)
        print_result("Vehicle in public listing", found)
    else:
        print_result("Vehicle in public listing", False)

    # 6. Verify vendor can see customer bookings for their own vehicles
    # Create a booking on the new vehicle first
    booking_data["vehicle_id"] = new_vehicle_id
    res = requests.post(f"{API_URL}/bookings/", json=booking_data, headers=cust_headers)
    if res.status_code == 201:
        vend_booking_id = res.json()["id"]
        # Check vendor bookings
        res = requests.get(f"{API_URL}/vendors/bookings/", headers=vend_headers)
        if res.status_code == 200:
            found = any(b["id"] == vend_booking_id for b in res.json()["results"])
            print_result("Vendor sees own bookings", found)
        else:
            print_result("Vendor sees own bookings", False)
    else:
        print_result("Vendor sees own bookings", False, "Could not create booking")

    # ---------------------------------------------------------
    # AUTHORIZATION TEST
    # ---------------------------------------------------------
    
    # 1. Unauthenticated access
    res1 = requests.get(f"{API_URL}/bookings/")
    res2 = requests.get(f"{API_URL}/vendors/dashboard/")
    print_result("Unauthenticated access denied", res1.status_code == 401 and res2.status_code == 401)

    # 2. Customer accessing vendor APIs
    res = requests.get(f"{API_URL}/vendors/dashboard/", headers=cust_headers)
    print_result("Customer denied vendor API", res.status_code == 403, res.text)

    # 3. Vendor modifying another vendor's vehicle
    res = requests.put(f"{API_URL}/vendors/vehicles/{vehicle_id}/", json={"price_per_day": "100"}, headers=vend_headers)
    print_result("Vendor cannot modify another's vehicle", res.status_code == 404) # 404 because queryset filters by vendor

    # 4. Customer accessing another customer's booking
    # Login as seed customer
    res = requests.post(f"{AUTH_URL}/login/", json={"email": "customer@transrentals.in", "password": "customer123"})
    cust2_token = res.json()["access"]
    cust2_headers = {"Authorization": f"Bearer {cust2_token}"}
    res = requests.get(f"{API_URL}/bookings/{booking_id}/", headers=cust2_headers)
    print_result("Customer cannot access another's booking", res.status_code == 404)

if __name__ == '__main__':
    try:
        run_tests()
    except Exception as e:
        print(f"Exception: {str(e)}")
