import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Car, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: searchParams.get('role') === 'vendor' ? 'VENDOR' : 'CUSTOMER',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authService.register(form);
      toast.success('Account created! Logging you in...');
      // Auto-login
      const { data } = await authService.login({ email: form.email, password: form.password });
      login({ access: data.access, refresh: data.refresh }, data.user);
      if (data.user.role === 'VENDOR') navigate('/vendor');
      else navigate('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-blue-600">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Car className="h-6 w-6 text-white" />
            </div>
            TransRentals
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm mb-5">Join thousands of happy travelers</p>

          {/* Role Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
            {['CUSTOMER', 'VENDOR'].map((r) => (
              <button key={r} type="button"
                onClick={() => setForm((p) => ({ ...p, role: r }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  form.role === r ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                }`}>
                {r === 'CUSTOMER' ? '🚗 Customer' : '🏢 Vendor'}
              </button>
            ))}
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Your full name" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="your@email.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className={`input-field ${errors.phone ? 'border-red-400' : ''}`} placeholder="10-digit mobile" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
              <input type="password" name="confirm_password" value={form.confirm_password}
                onChange={handleChange}
                className={`input-field ${errors.confirm_password ? 'border-red-400' : ''}`}
                placeholder="Re-enter password" />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : `Create ${form.role === 'VENDOR' ? 'Vendor' : 'Customer'} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
