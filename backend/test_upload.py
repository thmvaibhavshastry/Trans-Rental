import requests
import time
from io import BytesIO
from PIL import Image

API_URL = "http://localhost:8000/api"
AUTH_URL = f"{API_URL}/auth"

def print_result(name, success, error=""):
    status = "PASS" if success else "FAIL"
    print(f"[{status}] {name}")
    if not success:
        print(f"   Details: {error}")

def run_tests():
    print("Testing Image Upload End-to-End Flow...\n")
    timestamp = int(time.time())
    vend_email = f"testvendor_{timestamp}@example.com"
    
    # Register vendor
    res = requests.post(f"{AUTH_URL}/register/", json={
        "name": "Test Vendor",
        "email": vend_email,
        "phone": "9876543211",
        "password": "password123",
        "confirm_password": "password123",
        "role": "VENDOR"
    })
    print_result("Register new vendor", res.status_code == 201, res.text if res.status_code != 201 else "")

    # Login
    res = requests.post(f"{AUTH_URL}/login/", json={"email": vend_email, "password": "password123"})
    if res.status_code != 200:
        print_result("Vendor Login", False, res.text)
        return
    vend_token = res.json()["access"]
    vend_headers = {"Authorization": f"Bearer {vend_token}"}
    print_result("Vendor Login", True)

    # Create dummy image
    img_byte_arr = BytesIO()
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    
    files = {
        'image': ('test_bike.jpg', img_byte_arr, 'image/jpeg')
    }
    data = {
        "name": "Test Bike",
        "category": "BIKE",
        "brand": "Royal Enfield",
        "model": "Classic 350",
        "registration_number": f"BIKE{timestamp}",
        "price_per_day": "1000.00",
        "seats": 2,
        "fuel": "PETROL",
        "transmission": "MANUAL",
        "ac": "false",
        "location": "Bangalore",
        "status": "AVAILABLE"
    }
    
    res = requests.post(f"{API_URL}/vendors/vehicles/", data=data, files=files, headers=vend_headers)
    
    if res.status_code == 201:
        new_vehicle = res.json()
        print_result("Image Upload API", True)
    else:
        print_result("Image Upload API", False, res.text)
        return

    # Verify image URL serving
    image_display = new_vehicle.get('image_display')
    if image_display and "media/vehicles/" in image_display:
        # Check if URL works
        img_res = requests.get(image_display)
        print_result("Image URL serving", img_res.status_code == 200, f"HTTP {img_res.status_code} for {image_display}")
    else:
        print_result("Image URL serving", False, "Missing or invalid image_display URL")
        
    # Check public listing
    res = requests.get(f"{API_URL}/vehicles/?search=Royal Enfield")
    if res.status_code == 200:
        vehicles = res.json()["results"]
        found = next((v for v in vehicles if v["id"] == new_vehicle["id"]), None)
        if found:
            print_result("Customer vehicle listing image", found["image_display"] == image_display)
        else:
            print_result("Customer vehicle listing image", False, "Vehicle not found in listing")
    else:
         print_result("Customer vehicle listing image", False, res.text)
         
    # Check details page
    res = requests.get(f"{API_URL}/vehicles/{new_vehicle['id']}/")
    if res.status_code == 200:
        print_result("Vehicle details image", res.json()["image_display"] == image_display)
    else:
        print_result("Vehicle details image", False, res.text)

if __name__ == '__main__':
    try:
        run_tests()
    except Exception as e:
        print(f"Exception: {str(e)}")
