const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('canteen_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('canteen_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('canteen_token');
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (payload: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: any) => request<any>('/auth/change-password', { method: 'PUT', body: JSON.stringify(payload) }),

  // Categories
  getCategories: () => request<any>('/categories'),
  createCategory: (payload: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/products${query}`);
  },
  getProductById: (id: string) => request<any>(`/products/${id}`),
  createProduct: (payload: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  toggleProductAvailability: (id: string) => request<any>(`/products/${id}/toggle-availability`, { method: 'PATCH' }),
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),

  // Cart
  getCart: () => request<any>('/cart'),
  addToCart: (productId: string, quantity = 1) => request<any>('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (itemId: string, quantity: number) => request<any>(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (itemId: string) => request<any>(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clearCart: () => request<any>('/cart', { method: 'DELETE' }),

  // Orders
  placeOrder: (payload: { paymentMethod: string; notes?: string }) => request<any>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/orders${query}`);
  },
  getOrderById: (id: string) => request<any>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string, cancelledReason?: string) => request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, cancelledReason }) }),
  cancelOrder: (id: string, reason?: string) => request<any>(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  verifyPickupOtp: (id: string, otp: string) => request<any>(`/orders/${id}/verify-pickup`, { method: 'POST', body: JSON.stringify({ otp }) }),
  uploadImage: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },

  // Inventory
  getInventory: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/inventory${query}`);
  },
  addIngredient: (payload: any) => request<any>('/inventory', { method: 'POST', body: JSON.stringify(payload) }),
  updateIngredient: (id: string, payload: any) => request<any>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  restockIngredient: (id: string, amount: number, costPerUnit?: number, note?: string) => request<any>(`/inventory/${id}/restock`, { method: 'POST', body: JSON.stringify({ amount, costPerUnit, note }) }),
  adjustIngredient: (id: string, newQuantity: number, reason: string) => request<any>(`/inventory/${id}/adjust`, { method: 'POST', body: JSON.stringify({ newQuantity, reason }) }),
  deleteIngredient: (id: string) => request<any>(`/inventory/${id}`, { method: 'DELETE' }),
  getInventoryTransactions: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/inventory/transactions${query}`);
  },

  // Vendors
  getVendors: () => request<any>('/vendors'),
  getVendorById: (id: string) => request<any>(`/vendors/${id}`),
  getVendorStats: (vendorId?: string) => {
    const query = vendorId ? `?vendorId=${vendorId}` : '';
    return request<any>(`/vendor/dashboard/stats${query}`);
  },
  getVendorSalesReport: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/vendor/reports/sales${query}`);
  },
  getVendorInventoryReport: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/vendor/reports/inventory${query}`);
  },
  updateVendorProfile: (payload: any) => request<any>('/vendor/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Admin
  getAdminStats: () => request<any>('/admin/dashboard/stats'),
  getAdminUsers: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/admin/users${query}`);
  },
  updateUserRole: (userId: string, role: string) => request<any>(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  toggleUserStatus: (userId: string, isActive: boolean) => request<any>(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  getAdminVendors: () => request<any>('/admin/vendors'),
  getAdminAuditLogs: () => request<any>('/admin/audit-logs'),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),
};
