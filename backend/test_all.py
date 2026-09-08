import requests
from datetime import datetime, timedelta

API_URL = "http://localhost:8000/api"

def print_r(name, condition, error=""):
    print(f"[{'PASS' if condition else 'FAIL'}] {name} {f'- {error}' if error and not condition else ''}")

def run():
    print("Running API tests...\n")
    
    import time
    ts = str(int(time.time()))
    va_em, vb_em = f"va{ts}@x.com", f"vb{ts}@x.com"
    ca_em, cb_em = f"ca{ts}@x.com", f"cb{ts}@x.com"
    pwd = "SecurePass123!"
    
    requests.post(f"{API_URL}/auth/register/", json={"name": "Vendor A", "email": va_em, "phone": f"1{ts}", "password": pwd, "confirm_password": pwd, "role": "VENDOR"})
    requests.post(f"{API_URL}/auth/register/", json={"name": "Vendor B", "email": vb_em, "phone": f"2{ts}", "password": pwd, "confirm_password": pwd, "role": "VENDOR"})
    requests.post(f"{API_URL}/auth/register/", json={"name": "Cust A", "email": ca_em, "phone": f"3{ts}", "password": pwd, "confirm_password": pwd, "role": "CUSTOMER"})
    requests.post(f"{API_URL}/auth/register/", json={"name": "Cust B", "email": cb_em, "phone": f"4{ts}", "password": pwd, "confirm_password": pwd, "role": "CUSTOMER"})
    
    va_tok = requests.post(f"{API_URL}/auth/login/", json={"email": va_em, "password": pwd}).json().get("access")
    vb_tok = requests.post(f"{API_URL}/auth/login/", json={"email": vb_em, "password": pwd}).json().get("access")
    ca_tok = requests.post(f"{API_URL}/auth/login/", json={"email": ca_em, "password": pwd}).json().get("access")
    cb_tok = requests.post(f"{API_URL}/auth/login/", json={"email": cb_em, "password": pwd}).json().get("access")
    
    if not all([va_tok, vb_tok, ca_tok, cb_tok]):
        print("Auth failed")
        return
        
    va_h = {"Authorization": f"Bearer {va_tok}"}
    vb_h = {"Authorization": f"Bearer {vb_tok}"}
    ca_h = {"Authorization": f"Bearer {ca_tok}"}
    cb_h = {"Authorization": f"Bearer {cb_tok}"}
    
    # Vendor A creates vehicle
    res = requests.post(f"{API_URL}/vendors/vehicles/", headers=va_h, data={
        "name": "Test Bike", "category": "BIKE", "brand": "Brand", "model": "Mod",
        "registration_number": f"123{ts}", "price_per_day": "100", "location": "Bangalore",
        "status": "AVAILABLE"
    })
    if res.status_code != 201:
        print_r("Vendor A creates vehicle", False, res.text)
        return
    veh_id = res.json()["id"]
    print_r("Vendor A creates vehicle", True)
    
    # 2. Cust A books vehicle
    t_today = datetime.now()
    d_start = (t_today + timedelta(days=1)).strftime("%Y-%m-%d")
    d_end = (t_today + timedelta(days=2)).strftime("%Y-%m-%d")
    
    res = requests.post(f"{API_URL}/bookings/", headers=ca_h, json={
        "vehicle_id": veh_id,
        "customer_name": "Cust A", "customer_phone": "3", "customer_email": "ca@x.com",
        "pickup_location": "Bangalore", "pickup_date": d_start, "return_date": d_end
    })
    book_id_a = res.json().get("id")
    print_r("Cust A books vehicle", res.status_code == 201, res.text)
    
    # 3. Cust B tries to book overlapping (should fail)
    res = requests.post(f"{API_URL}/bookings/", headers=cb_h, json={
        "vehicle_id": veh_id,
        "customer_name": "Cust B", "customer_phone": "4", "customer_email": "cb@x.com",
        "pickup_location": "Bangalore", "pickup_date": d_start, "return_date": d_end
    })
    print_r("Double booking prevented", res.status_code != 201, "Allowed overlapping booking!")
    
    # 4. Auth tests
    res = requests.patch(f"{API_URL}/vendors/bookings/{book_id_a}/", headers=vb_h, json={"status": "COMPLETED"})
    print_r("Vendor B cannot modify Vendor A booking", res.status_code in [403, 404], res.status_code)
    
    res = requests.get(f"{API_URL}/bookings/{book_id_a}/", headers=cb_h)
    print_r("Cust B cannot view Cust A booking", res.status_code in [403, 404], res.status_code)
    
    # 5. Cancellation
    res = requests.patch(f"{API_URL}/bookings/{book_id_a}/", headers=ca_h, json={"status": "CANCELLED"})
    print_r("Cust A cancels booking", res.status_code == 200 and res.json().get("status") == "CANCELLED", res.text)
    
    res = requests.patch(f"{API_URL}/bookings/{book_id_a}/", headers=ca_h, json={"status": "CONFIRMED"})
    print_r("Cust A cannot reactivate CANCELLED to CONFIRMED", res.status_code != 200, "Was able to reactivate!")

    # 6. Emails
    print_r("Check Emails", False, "Not yet checked.")
    
if __name__ == '__main__':
    run()
