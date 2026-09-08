# TransRentals 2.0 — MVP

A modern vehicle rental marketplace built with React + Django REST Framework + PostgreSQL.

---

## 📁 Project Structure

```
TransRentals/
├── backend/               # Django REST API
│   ├── transrentals/      # Django project settings
│   ├── accounts/          # Custom user model, authentication
│   ├── vendors/           # Vendor model, dashboard, permissions
│   ├── vehicles/          # Vehicle model, listing, CRUD
│   ├── bookings/          # Booking model, customer & vendor views
│   ├── media/             # Uploaded vehicle images
│   ├── requirements.txt
│   └── .env               # Environment variables (not in git)
│
└── frontend/              # React application
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components (routes)
    │   ├── layouts/       # Layout wrappers
    │   ├── services/      # API service modules
    │   ├── hooks/         # Custom React hooks
    │   ├── context/       # Auth context
    │   └── utils/         # Helpers and constants
    └── public/
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## 🐘 PostgreSQL Setup

1. Install PostgreSQL and start the service.
2. Create a database:

```sql
CREATE DATABASE transrentals_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE transrentals_db TO postgres;
```

---

## ⚙️ Environment Variables

Edit `backend/.env`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_NAME=transrentals_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

---

## 🐍 Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed development data
python manage.py seed_data

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

Backend runs at: **http://localhost:8000**

Django Admin: **http://localhost:8000/admin**

---

## ⚛️ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 🔑 Seed Data Credentials

After running `python manage.py seed_data`:

| Role     | Email                        | Password    |
|----------|------------------------------|-------------|
| Vendor 1 | vendor1@transrentals.in      | vendor123   |
| Vendor 2 | vendor2@transrentals.in      | vendor123   |
| Customer | customer@transrentals.in     | customer123 |
| Admin    | admin@transrentals.in        | admin123    |

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/refresh/
GET    /api/auth/profile/
```

### Vehicles (Public)
```
GET    /api/vehicles/
GET    /api/vehicles/:id/
```

### Bookings (Customer)
```
POST   /api/bookings/
GET    /api/bookings/
GET    /api/bookings/:id/
```

### Vendor APIs
```
GET    /api/vendors/dashboard/
GET    /api/vendors/vehicles/
POST   /api/vendors/vehicles/
PUT    /api/vendors/vehicles/:id/
DELETE /api/vendors/vehicles/:id/
GET    /api/vendors/bookings/
PATCH  /api/vendors/bookings/:id/
```

---

## 📱 Frontend Routes

| Route                         | Description           |
|-------------------------------|-----------------------|
| `/`                           | Homepage              |
| `/search`                     | Vehicle Search        |
| `/vehicles/:id`               | Vehicle Details       |
| `/booking/:vehicleId`         | Booking Form          |
| `/booking-success/:bookingId` | Booking Confirmation  |
| `/dashboard`                  | Customer Dashboard    |
| `/login`                      | Login                 |
| `/register`                   | Registration          |
| `/vendor`                     | Vendor Dashboard      |
| `/vendor/vehicles`            | Manage Vehicles       |
| `/vendor/vehicles/add`        | Add Vehicle           |
| `/vendor/bookings`            | Vendor Bookings       |

---

## 🏗️ Technology Stack

- **Frontend:** React.js, Tailwind CSS, React Router, Axios
- **Backend:** Django 5, Django REST Framework, Simple JWT
- **Database:** PostgreSQL
- **Auth:** JWT (access: 1 day, refresh: 7 days)
