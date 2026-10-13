import { MenuItem, Order, OrderStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  public details?: any;
  public status?: number;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError('Network error: Unable to reach the server. Please check your connection.', 0);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Invalid response received from server', response.status);
  }

  if (!response.ok || !data.success) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data?.details);
  }

  return data;
}

export const api = {
  // Menu
  getMenu: async (category?: string, search?: string): Promise<MenuItem[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search && search.trim()) params.append('search', search.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ data: MenuItem[] }>(`/menu${queryString}`);
    return res.data;
  },

  getMenuItem: async (id: string): Promise<MenuItem> => {
    const res = await request<{ data: MenuItem }>(`/menu/${id}`);
    return res.data;
  },

  // Orders
  createOrder: async (payload: {
    customer: { name: string; phone: string; address: string };
    items: { productId: string; quantity: number }[];
  }): Promise<Order> => {
    const res = await request<{ data: Order; message: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  getOrderById: async (idOrNumber: string): Promise<Order> => {
    const res = await request<{ data: Order }>(`/orders/${encodeURIComponent(idOrNumber)}`);
    return res.data;
  },

  // Admin
  getAllOrders: async (adminKey: string, limit = 50, skip = 0): Promise<{ orders: Order[]; total: number }> => {
    const res = await request<{ data: Order[]; total: number }>(`/orders?limit=${limit}&skip=${skip}`, {
      headers: {
        'x-admin-key': adminKey,
      },
    });
    return { orders: res.data, total: res.total };
  },

  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus,
    adminKey: string,
    note?: string
  ): Promise<Order> => {
    const res = await request<{ data: Order; message: string }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ status, note }),
    });
    return res.data;
  },

  // Simulation
  simulateProgression: async (orderId: string): Promise<Order> => {
    const res = await request<{ data: Order; message: string }>(`/orders/${orderId}/simulate`, {
      method: 'POST',
    });
    return res.data;
  },
};
