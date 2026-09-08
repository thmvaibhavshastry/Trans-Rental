import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loading } from '../components/States';
import { vendorService } from '../services/vendorService';
import { useCategories } from '../hooks/useCategories';
import { LOCATIONS, VEHICLE_STATUSES, getErrorMessage } from '../utils/helpers';
import CustomDropdown from '../components/CustomDropdown';

const INITIAL = {
  name: '', category: 'CAR', brand: '', model: '',
  registration_number: '', image_url: '', price_per_day: '',
  location: 'Bangalore', city: '', locality: '', address: '', google_maps_url: '',
  status: 'AVAILABLE', features: '',
  specifications: {}
};

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}{required && ' *'}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default function VehicleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [form, setForm] = useState(INITIAL);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      vendorService.getVehicles()
        .then((res) => {
          const v = (res.data.results || []).find((v) => v.id === parseInt(id));
          if (v) {
            setForm({
              name: v.name || '', category: v.category || 'CAR', brand: v.brand || '',
              model: v.model || '', registration_number: v.registration_number || '',
              image_url: v.image_url || '', price_per_day: v.price_per_day || '',
              location: v.location || 'Bangalore', 
              city: v.city || '', locality: v.locality || '', 
              address: v.address || '', google_maps_url: v.google_maps_url || '',
              status: v.status || 'AVAILABLE', 
              features: v.features || '',
              specifications: typeof v.specifications === 'string' ? JSON.parse(v.specifications) : (v.specifications || {})
            });
            setImagePreview(v.image_display || '');
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({
      ...p,
      specifications: {
        ...p.specifications,
        [name]: value
      }
    }));
  };

  const handleCategoryChange = (e) => {
    // When category changes, reset specifications
    setForm(p => ({ ...p, category: e.target.value, specifications: {} }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name required';
    if (!form.brand.trim()) errs.brand = 'Brand required';
    if (!form.model.trim()) errs.model = 'Model required';
    if (!form.registration_number.trim()) errs.registration_number = 'Registration number required';
    if (!form.price_per_day || parseFloat(form.price_per_day) <= 0) errs.price_per_day = 'Valid price required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = { ...form };
      
      // Convert spec object to JSON string for FormData if multipart/form-data
      payload.specifications = JSON.stringify(form.specifications);

      if (imageFile) payload.image = imageFile;
      
      if (isEdit) {
        await vendorService.updateVehicle(id, payload);
        toast.success('Vehicle updated!');
      } else {
        await vendorService.addVehicle(payload);
        toast.success('Vehicle added successfully!');
      }
      navigate('/vendor/vehicles');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || categoriesLoading) return <div className="min-h-screen bg-slate-50"><Navbar /><Loading /></div>;

  const activeCategorySpecs = categories[form.category]?.specs || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/vendor/vehicles" className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-slate-900 mb-6 text-lg border-b border-slate-100 pb-2">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Category" name="category" required>
                <CustomDropdown
                  value={form.category}
                  onChange={(val) => setForm(p => ({ ...p, category: val, specifications: {} }))}
                  options={Object.entries(categories).map(([k, v]) => ({ label: v.label, value: k }))}
                  placeholder={categoriesLoading ? "Loading categories..." : "Select Category"}
                  disabled={categoriesLoading || Object.keys(categories).length === 0}
                  className="bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors"
                />
              </Field>
              <Field label="Registration Number" name="registration_number" required error={errors.registration_number}>
                <input name="registration_number" value={form.registration_number} onChange={handleChange}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors ${errors.registration_number ? 'border-red-400' : ''}`} placeholder="e.g. KA01AB1234" />
              </Field>
              <Field label="Brand / Make" name="brand" required error={errors.brand}>
                <input name="brand" value={form.brand} onChange={handleChange}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors ${errors.brand ? 'border-red-400' : ''}`} placeholder="e.g. JCB, Tata, Honda" />
              </Field>
              <Field label="Model" name="model" required error={errors.model}>
                <input name="model" value={form.model} onChange={handleChange}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors ${errors.model ? 'border-red-400' : ''}`} placeholder="e.g. 3DX Super" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Listing Title / Display Name" name="name" required error={errors.name}>
                  <input name="name" value={form.name} onChange={handleChange}
                    className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. JCB 3DX Super Backhoe Loader" />
                </Field>
              </div>
            </div>
          </div>

          {/* Specifications (Dynamic) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-slate-900 mb-6 text-lg border-b border-slate-100 pb-2">Category Specifications</h2>
            {activeCategorySpecs.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No specific attributes required for this category.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeCategorySpecs.map(spec => (
                  <Field key={spec.name} label={spec.label} name={spec.name}>
                    {spec.type === 'select' ? (
                      <CustomDropdown
                        value={form.specifications[spec.name] || ''}
                        onChange={(val) => handleSpecChange({ target: { name: spec.name, value: val } })}
                        options={spec.options.map(opt => ({ label: opt, value: opt }))}
                        className="bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors"
                      />
                    ) : (
                      <input type={spec.type} name={spec.name} value={form.specifications[spec.name] || ''} onChange={handleSpecChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors" placeholder={`Enter ${spec.label.toLowerCase()}`} />
                    )}
                  </Field>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Location */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-slate-900 mb-6 text-lg border-b border-slate-100 pb-2">Pricing & Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Price Per Day (₹)" name="price_per_day" required error={errors.price_per_day}>
                <input type="number" name="price_per_day" value={form.price_per_day} onChange={handleChange}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors ${errors.price_per_day ? 'border-red-400' : ''}`} placeholder="1500" min="0" />
              </Field>
              <Field label="Status" name="status">
                <CustomDropdown
                  value={form.status}
                  onChange={(val) => setForm(p => ({ ...p, status: val }))}
                  options={VEHICLE_STATUSES.map(s => ({ label: s, value: s }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors"
                />
              </Field>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-slate-900 mb-6 text-lg border-b border-slate-100 pb-2">Pickup Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="City" name="city">
                <input name="city" value={form.city} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors" placeholder="e.g. Bangalore" />
              </Field>
              <Field label="Area / Locality" name="locality">
                <input name="locality" value={form.locality} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors" placeholder="e.g. Indiranagar" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Full Pickup Address" name="address">
                  <textarea name="address" value={form.address} onChange={handleChange} rows="3"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors resize-none" placeholder="Enter complete address for customers to find the vehicle..." />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Google Maps Link" name="google_maps_url">
                  <input type="url" name="google_maps_url" value={form.google_maps_url} onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors" placeholder="https://goo.gl/maps/..." />
                </Field>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-slate-900 mb-6 text-lg border-b border-slate-100 pb-2">Vehicle Image</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload Image</label>
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-slate-50 transition-colors bg-white">
                  <Upload className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500 font-medium">{imageFile ? imageFile.name : 'Click to upload'}</span>
                  <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Or Image URL</label>
                <input name="image_url" value={form.image_url} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors mb-3" placeholder="https://..." />
                {imagePreview && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 h-20 w-full bg-slate-100">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-slate-900 mb-2 text-lg border-b border-slate-100 pb-2">Additional Features</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-wide">Comma-separated list</p>
            <input name="features" value={form.features} onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors" placeholder="e.g. GPS, Heavy Duty Tyres, AC Cabin" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
            <button type="submit" disabled={submitting} className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-sm flex-1">
              {submitting ? 'Saving...' : (isEdit ? 'Update Listing' : 'Publish Listing')}
            </button>
            <Link to="/vendor/vehicles" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-8 rounded-lg transition-colors text-center shadow-sm sm:w-1/3">
              Cancel
            </Link>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
