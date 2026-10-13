import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Phone,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api, ApiError } from '../services/api';
import { validateCustomerForm } from '../utils/validators';
import { formatCurrency } from '../utils/formatCurrency';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // If cart is empty, render friendly empty state
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-orange-50 text-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your basket is empty</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
          You don't have any food items in your cart to checkout.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-2xl shadow-md shadow-brand-500/25 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Menu</span>
        </Link>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error as user edits
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions caused by repeated clicks
    if (isSubmitting) return;

    // Validate form fields
    const validation = validateCustomerForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      // Submit only product IDs and quantities to the server
      // The server calculates unit prices, subtotal, delivery fee and total securely from DB
      const payload = {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        },
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const placedOrder = await api.createOrder(payload);

      // Clear the local cart
      clearCart();

      // Navigate to order confirmation page with order state
      navigate(`/order-confirmed/${placedOrder.orderNumber}`, {
        state: { order: placedOrder },
      });
    } catch (err: any) {
      if (err instanceof ApiError && err.details && Array.isArray(err.details)) {
        // Map backend validation errors back to form fields if applicable
        const serverFieldErrors: Record<string, string> = {};
        err.details.forEach((d: any) => {
          if (d.field?.includes('customer.name')) serverFieldErrors.name = d.message;
          if (d.field?.includes('customer.phone')) serverFieldErrors.phone = d.message;
          if (d.field?.includes('customer.address')) serverFieldErrors.address = d.message;
        });

        if (Object.keys(serverFieldErrors).length > 0) {
          setFieldErrors(serverFieldErrors);
        } else {
          setServerError(err.message || 'Validation failed. Please verify your details.');
        }
      } else {
        setServerError(err.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Customer Information Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h1 className="text-2xl font-black text-slate-900 mb-1">
              Delivery Details
            </h1>
            <p className="text-xs text-slate-500 mb-6">
              Enter your contact details and drop-off location for fast delivery.
            </p>

            {serverError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full bg-slate-50 border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      fieldErrors.name
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210 or +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full bg-slate-50 border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      fieldErrors.phone
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                    }`}
                  />
                </div>
                {fieldErrors.phone ? (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5">
                    {fieldErrors.phone}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used by the delivery partner to reach you at the gate.
                  </p>
                )}
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Delivery Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                  <textarea
                    rows={3}
                    placeholder="House/Flat number, Building name, Street name, Landmark, City"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full bg-slate-50 border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      fieldErrors.address
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'
                    }`}
                  />
                </div>
                {fieldErrors.address && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5">
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black text-base py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 active:scale-98 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Place Order • {formatCurrency(total)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </h2>

            {/* Items list */}
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mb-6">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {quantity} × {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm shrink-0">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Partner Fee</span>
                <span className="font-bold text-slate-900">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-base">
                <span className="font-black text-slate-900">Total Payable</span>
                <span className="font-black text-brand-600 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong className="font-bold">Server Verified:</strong> Product prices are always re-validated against our database catalog before payment/order confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
