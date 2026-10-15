import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  RefreshCw,
  Clock,
  CheckCircle,
  Truck,
  Utensils,
} from 'lucide-react';
import { AdminOrder, OrderStatus } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { LoadingSpinner } from '../components/LoadingSpinner';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'ORDER_RECEIVED', label: 'Order Received' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export const AdminOrdersPage: React.FC = () => {
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>(adminKey);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const fetchOrders = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAllOrders(key);
      setOrders(res.orders);
      setIsAuthenticated(true);

    } catch (err: any) {
      setError(err.message || 'Unauthorized access. Please provide valid Admin API Key.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      fetchOrders(adminKey);
    }
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(inputKey.trim());
    fetchOrders(inputKey.trim());
  };

  const handleUpdateStatus = async (orderId: string, targetStatus: OrderStatus) => {
    try {
      setStatusUpdating(orderId);
      const updated = await api.updateOrderStatus(orderId, targetStatus, adminKey);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setStatusUpdating(null);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Kitchen Admin Portal</h1>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            Enter the authorized admin key to access restaurant dispatch management.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold mb-4 text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleKeySubmit} className="space-y-4">
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter Admin API Key"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-sm"
            >
              Authenticate Portal
            </button>
          </form>


        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Kitchen Orders Dashboard</h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage preparation status, view incoming dispatch requests and order histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOrders(adminKey)}
            disabled={loading}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching kitchen orders..." />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
          <p className="text-sm font-bold text-slate-700">No customer orders placed yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Order ID & Date</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Items Snapshot</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Current Status</th>
                  <th className="py-4 px-6">Manage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isUpdating = statusUpdating === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {new Date(order.createdAt).toLocaleDateString()}{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 block">
                          {order.customer.name}
                        </span>
                        <span className="text-slate-500 block">{order.customer.phone}</span>
                        <span className="text-slate-600 text-[11px] line-clamp-1 max-w-xs">
                          {order.customer.address}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800 block">
                          {order.items.length} items
                        </span>
                        <span className="text-slate-500 text-[11px] line-clamp-1">
                          {order.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'PREPARING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {order.status === 'ORDER_RECEIVED' && <Clock className="w-3 h-3" />}
                          {order.status === 'PREPARING' && <Utensils className="w-3 h-3" />}
                          {order.status === 'OUT_FOR_DELIVERY' && <Truck className="w-3 h-3" />}
                          {order.status === 'DELIVERED' && <CheckCircle className="w-3 h-3" />}
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Status Action Dropdown */}
                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          disabled={isUpdating || order.status === 'DELIVERED'}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
                        >
                          {STATUS_OPTIONS.filter((_, index) => {
                            const current = STATUS_OPTIONS.findIndex(option => option.value === order.status);
                            return index === current || index === current + 1;
                          }).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
