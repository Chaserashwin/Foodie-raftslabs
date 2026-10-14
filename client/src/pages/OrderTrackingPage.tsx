import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Calendar,
  MapPin,
  Phone,
  User,
  Sparkles,
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { OrderTimeline } from '../components/OrderTimeline';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatCurrency } from '../utils/formatCurrency';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState<string>(orderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(!!orderId);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const requestVersion = useRef(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const fetchOrder = async (idToFetch: string, showSpinner = true) => {
    if (!idToFetch.trim()) return;
    const version = ++requestVersion.current;

    try {
      if (showSpinner) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const data = await api.getOrderById(idToFetch.trim());
      if (version !== requestVersion.current) return;
      setOrder(data);
      setRefreshError(null);
    } catch (err: any) {
      if (version !== requestVersion.current) return;
      if (showSpinner) {
        setError(err.message || 'Unable to locate order.');
        setOrder(null);
      } else setRefreshError(err.message || 'Could not refresh.');
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // Initial fetch on mount or URL change
  useEffect(() => {
    if (orderId) {
      setSearchId(orderId);
      fetchOrder(orderId, true);
    }
    return () => { requestVersion.current++; };
  }, [orderId]);

  // Polling every 5 seconds if order is not yet DELIVERED
  useEffect(() => {
    if (!order || order.status === 'DELIVERED') return;

    const interval = setInterval(() => {
      fetchOrder(order.orderNumber, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.status, order?.orderNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/track/${encodeURIComponent(searchId.trim())}`);
      if (orderId === searchId.trim()) fetchOrder(searchId.trim(), true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {refreshError && <p role="alert" className="text-rose-700">{refreshError} Showing last known status; retrying automatically.</p>}
      {/* Search Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="max-w-xl mx-auto text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Track Delivery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Check the live kitchen and delivery status of your meal in real-time.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Order ID (e.g. FD-20261013-1234)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md shadow-brand-500/20 transition-all shrink-0 active:scale-95"
          >
            Track
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && <LoadingSpinner message="Checking live order status..." />}

      {/* Error state */}
      {!loading && error && (
        <ErrorMessage
          title="Order Not Found"
          message={error}
          onRetry={() => searchId && fetchOrder(searchId, true)}
        />
      )}

      {/* Tracking Details View */}
      {!loading && !error && order && (
        <div className="space-y-6">
          {/* Top Status Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Order Number
                  </span>
                  <span className="font-mono font-black text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-lg">
                    {order.orderNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Polling / Manual refresh status */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchOrder(order.orderNumber, false)}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-colors"
                  title="Refresh order status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Updating...' : order.status === 'DELIVERED' ? 'Refresh Status' : 'Live Polling Active'}</span>
                </button>


              </div>
            </div>

            {/* Visual Timeline */}
            <div className="pt-6">
              <OrderTimeline currentStatus={order.status} timeline={order.timeline} />
            </div>

            {order.status !== 'DELIVERED' && (
              <div className="mt-6 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/50 flex items-center justify-between text-xs text-amber-800">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  Auto-refreshing status every 5 seconds...
                </span>

              </div>
            )}
          </div>

          {/* Details & Items Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ordered Items */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-500" />
                <span>Purchased Items</span>
              </h3>

              <div className="divide-y divide-slate-100 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <span className="font-black text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>Total</span>
                  <span className="text-brand-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Recipient Info */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>Delivery Recipient</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{order.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{order.customer.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{order.customer.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
