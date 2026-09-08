import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, CreditCard, Banknote, Calendar, Clock, ArrowRight, Shield, Star, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingSummary from '../components/BookingSummary';
import { Loading, ErrorState } from '../components/States';
import { vehicleService } from '../services/vehicleService';
import { bookingService } from '../services/bookingService';
import RentalDateTimePicker from '../components/RentalDateTimePicker';
import { getErrorMessage, toDatetimeLocal } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

function localNow() {
  return toDatetimeLocal(new Date());
}
function localTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDatetimeLocal(d);
}

export default function BookingPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Pre-fill from URL params (passed from SearchPage/VehicleCard)
  const prePickup = searchParams.get('pickup_datetime') || localNow();
  const preReturn = searchParams.get('return_datetime') || localTomorrow();

  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [vehicleError, setVehicleError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mockPaymentData, setMockPaymentData] = useState(null);

  const [form, setForm] = useState({
    customer_name: user?.name || '',
    customer_phone: user?.phone || '',
    customer_email: user?.email || '',
    pickup_location: '',
    pickup_datetime: prePickup,
    return_datetime: preReturn,
    payment_method: 'ONLINE',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    vehicleService.getVehicle(vehicleId)
      .then((res) => { setVehicle(res.data); setLoadingVehicle(false); })
      .catch((err) => { setVehicleError(getErrorMessage(err)); setLoadingVehicle(false); });

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [vehicleId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.customer_name.trim()) errs.customer_name = 'Name is required';
    if (!form.customer_phone.trim()) errs.customer_phone = 'Phone is required';
    if (!/^\d{10}$/.test(form.customer_phone.replace(/\s/g, ''))) errs.customer_phone = 'Enter valid 10-digit phone';
    if (!form.customer_email.trim()) errs.customer_email = 'Email is required';
    if (!form.pickup_location.trim()) errs.pickup_location = 'Pickup location is required';
    if (!form.pickup_datetime) errs.pickup_datetime = 'Pickup date & time is required';
    if (!form.return_datetime) errs.return_datetime = 'Return date & time is required';
    if (form.pickup_datetime && form.return_datetime && new Date(form.return_datetime) <= new Date(form.pickup_datetime)) {
      errs.return_datetime = 'Return must be after pickup';
    }
    if (form.pickup_datetime && new Date(form.pickup_datetime) < new Date()) {
      errs.pickup_datetime = 'Pickup cannot be in the past';
    }
    return errs;
  };

  const handleRazorpayPayment = async (bookingData) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_testkey',
      amount: bookingData.total_amount * 100, // Amount in paise
      currency: 'INR',
      name: 'TransRentals',
      description: `Booking for ${vehicle?.name}`,
      order_id: bookingData.razorpay_order_id,
      handler: async function (response) {
        try {
          setSubmitting(true);
          await bookingService.verifyPayment(bookingData.id, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success('Payment successful! Booking confirmed.');
          navigate(`/booking-success/${bookingData.id}`);
        } catch (error) {
          toast.error(getErrorMessage(error) || 'Payment verification failed');
          setSubmitting(false);
        }
      },
      prefill: {
        name: form.customer_name,
        email: form.customer_email,
        contact: form.customer_phone,
      },
      theme: {
        color: '#2563eb',
      },
      modal: {
        ondismiss: function () {
          toast.error('Payment cancelled');
          setSubmitting(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      toast.error(response.error.description);
      setSubmitting(false);
    });
    rzp.open();
  };

  const handleMockPayment = async (status) => {
    setSubmitting(true);
    try {
      await bookingService.verifyPayment(mockPaymentData.id, {
        razorpay_order_id: mockPaymentData.mock_order_id,
        mock_status: status,
      });
      if (status === 'SUCCESS') {
        toast.success('Mock payment successful! Booking confirmed.');
        navigate(`/booking-success/${mockPaymentData.id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Mock payment failed');
      setSubmitting(false);
      if (status === 'FAILED') {
        setMockPaymentData(null); // Return to form
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const { data } = await bookingService.createBooking({
        vehicle_id: parseInt(vehicleId),
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email,
        pickup_location: form.pickup_location,
        // Send as ISO strings — backend accepts these as DateTimeField
        pickup_datetime: new Date(form.pickup_datetime).toISOString(),
        return_datetime: new Date(form.return_datetime).toISOString(),
        payment_method: form.payment_method,
      });

      if (form.payment_method === 'ONLINE') {
        if (data.payment_mode === 'MOCK') {
          setMockPaymentData(data);
          setSubmitting(false);
        } else {
          handleRazorpayPayment(data);
        }
      } else {
        toast.success('Booking confirmed! Please pay at pickup.');
        navigate(`/booking-success/${data.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loadingVehicle) return <div className="min-h-screen bg-gray-50"><Navbar /><Loading text="Loading vehicle..." /></div>;
  if (vehicleError) return <div className="min-h-screen bg-gray-50"><Navbar /><ErrorState message={vehicleError} /></div>;

  if (mockPaymentData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-8 text-center">
            <div className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
              TEST MODE
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Payment</h2>
            <p className="text-gray-500 mb-6">This is a simulated payment.<br/>No real money will be charged.</p>
            
            <div className="text-4xl font-bold text-gray-900 mb-8">
              ₹{mockPaymentData.total_amount}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleMockPayment('SUCCESS')}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> : null}
                Simulate Successful Payment
              </button>
              <button
                onClick={() => handleMockPayment('FAILED')}
                disabled={submitting}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-lg transition-colors"
              >
                Simulate Failed Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/vehicles/${vehicleId}`} className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
            <p className="text-sm text-gray-500">Fill in your details to confirm the reservation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Details */}
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" /> Personal Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input name="customer_name" value={form.customer_name} onChange={handleChange}
                      className={`input-field ${errors.customer_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="Your full name" />
                    {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                    <input name="customer_phone" value={form.customer_phone} onChange={handleChange}
                      className={`input-field ${errors.customer_phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="10-digit mobile number" />
                    {errors.customer_phone && <p className="text-red-500 text-xs mt-1">{errors.customer_phone}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                    <input type="email" name="customer_email" value={form.customer_email} onChange={handleChange}
                      className={`input-field ${errors.customer_email ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="your@email.com" />
                    {errors.customer_email && <p className="text-red-500 text-xs mt-1">{errors.customer_email}</p>}
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" /> Trip Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Location *</label>
                    <input name="pickup_location" value={form.pickup_location} onChange={handleChange}
                      className={`input-field ${errors.pickup_location ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder={`e.g. ${vehicle?.location || 'City, Area'}`} />
                    {errors.pickup_location && <p className="text-red-500 text-xs mt-1">{errors.pickup_location}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Date & Time *</label>
                    <RentalDateTimePicker
                      label="Pickup Date & Time"
                      type="pickup"
                      variant="form"
                      value={form.pickup_datetime}
                      min={localNow()}
                      onChange={(val) => handleChange({ target: { name: 'pickup_datetime', value: val } })}
                      errorClass={errors.pickup_datetime ? 'border-red-400' : ''}
                    />
                    {errors.pickup_datetime && <p className="text-red-500 text-xs mt-1">{errors.pickup_datetime}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Date & Time *</label>
                    <RentalDateTimePicker
                      label="Return Date & Time"
                      type="return"
                      variant="form"
                      value={form.return_datetime}
                      min={form.pickup_datetime || localNow()}
                      onChange={(val) => handleChange({ target: { name: 'return_datetime', value: val } })}
                      errorClass={errors.return_datetime ? 'border-red-400' : ''}
                    />
                    {errors.return_datetime && <p className="text-red-500 text-xs mt-1">{errors.return_datetime}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" /> Payment Method
                </h2>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${form.payment_method === 'ONLINE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment_method" value="ONLINE"
                      checked={form.payment_method === 'ONLINE'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Pay Online (Razorpay)</span>
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Pay securely via UPI, Credit/Debit Card, or Netbanking.</p>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${form.payment_method === 'OFFLINE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment_method" value="OFFLINE"
                      checked={form.payment_method === 'OFFLINE'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">Pay at Pickup</span>
                        <Banknote className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Reserve now and pay when you pick up the vehicle.</p>
                    </div>
                  </label>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                {submitting ? (
                  <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> Processing...</>
                ) : form.payment_method === 'ONLINE' ? 'Pay & Confirm Booking' : 'Confirm Booking'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <BookingSummary
              vehicle={vehicle}
              pickupDatetime={form.pickup_datetime}
              returnDatetime={form.return_datetime}
              pickupLocation={form.pickup_location}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
