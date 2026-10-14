import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(
    (location.state as { order?: Order })?.order || null
  );
  const [loading, setLoading] = useState<boolean>(!order);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!order && orderId) {
      api
        .getOrderById(orderId)
        .then((data) => setOrder(data))
        .catch((err) => console.error('Failed to load order:', err))
        .finally(() => setLoading(false));
    }
  }, [order, orderId]);

  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving your order confirmation..." />;
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          We could not find order details for {orderId}.
        </p>
        <Link
          to="/"
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Badge */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-in zoom-in-75">
          <CheckCircle className="w-10 h-10" />
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Order Successfully Placed
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
          Thank you, {order.customer.name.split(' ')[0]}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Your order has been transmitted to our kitchen. You can track live preparation and delivery below.
        </p>

        {/* Order ID pill */}
        <div className="mt-6 inline-flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
          <span className="text-xs text-slate-500 font-semibold">Order ID:</span>
          <span className="font-mono font-black text-slate-900 text-sm tracking-wide">
            {order.orderNumber}
          </span>
          <button
            onClick={copyOrderNumber}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Copy Order ID"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={`/track/${order.orderNumber}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-brand-500/25 active:scale-98 transition-all"
          >
            <span>Live Order Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-bold text-slate-600 hover:text-slate-900 px-6 py-3.5 rounded-2xl hover:bg-slate-100 transition-colors"
          >
            Order More Dishes
          </Link>
        </div>
      </div>

      {/* Order Details & Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-brand-500" />
          <span>Purchased Items Snapshot</span>
        </h2>

        <div className="divide-y divide-slate-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  Qty: {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>
              <span className="font-extrabold text-slate-900">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-bold text-slate-900">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="font-bold text-slate-900">{formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-base">
            <span className="font-black text-slate-900">Total Paid</span>
            <span className="font-black text-brand-600">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Delivery Address
          </h3>
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <User className="w-4 h-4 text-slate-500" />
              <span>{order.customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{order.customer.phone}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>{order.customer.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
