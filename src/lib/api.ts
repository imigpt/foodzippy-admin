const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Auth APIs
  async login(email: string, password: string) {
    return this.request<{
      success: boolean;
      token: string;
      admin: { email: string; role: string };
    }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Vendor APIs
  async getVendors(params?: {
    page?: number;
    limit?: number;
    status?: string;
    city?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<PaginatedResponse<any>>(
      `/api/admin/vendors${queryString ? `?${queryString}` : ''}`
    );
  }

  async getVendorsByAgent(agentId: string, params?: {
    status?: string;
    dateFilter?: string;
    followUpFilter?: string;
    includeStats?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams({ agentId });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.request<{
      success: boolean;
      data: any[];
      statistics?: any;
      pagination?: any;
    }>(`/api/admin/vendors?${queryParams.toString()}`);
  }

  async getVendorById(id: string) {
    return this.request<ApiResponse<any>>(`/api/admin/vendors/${id}`);
  }

  async updateVendor(id: string, data: any) {
    return this.request<ApiResponse<any>>(`/api/admin/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getAnalytics() {
    return this.request<{
      success: boolean;
      data: {
        monthlyRequests: Array<{ year: number; month: number; count: number }>;
        summary: {
          total: number;
          pending: number;
          approved: number;
          rejected: number;
        };
      };
    }>('/api/admin/vendors/analytics');
  }

  // Agent APIs
  async getAgents() {
    return this.request<{
      success: boolean;
      agents: any[];
      count: number;
    }>('/api/agents');
  }

  // User APIs (New unified system for agents & employees)
  async getUsers(role?: 'agent' | 'employee') {
    const queryString = role ? `?role=${role}` : '';
    return this.request<{
      success: boolean;
      users: any[];
      count: number;
    }>(`/api/admin/users${queryString}`);
  }

  async createUser(data: { name: string; username: string; password: string; role: 'agent' | 'employee'; mobileNumber?: string; email?: string; dob?: string }) {
    return this.request<{
      success: boolean;
      user: any;
      message: string;
    }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserById(id: string, data: any, profileImage?: File) {
    // If profile image is provided, use FormData
    if (profileImage) {
      const formData = new FormData();
      formData.append('profileImage', profileImage);
      
      // Append other data fields
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key].toString());
        }
      });

      return this.request<{
        success: boolean;
        user: any;
        message: string;
      }>(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary
      });
    }

    // Otherwise, use JSON
    return this.request<{
      success: boolean;
      user: any;
      message: string;
    }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUserById(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserByIdAdmin(id: string) {
    return this.request<{
      success: boolean;
      user: any;
    }>(`/api/admin/users/${id}`);
  }

  async createAgent(data: { name: string; username: string; password: string }) {
    return this.request<{
      success: boolean;
      agent: any;
      message: string;
    }>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgent(id: string, data: any) {
    return this.request<{
      success: boolean;
      agent: any;
      message: string;
    }>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async getAgentById(id: string) {
    return this.request<{
      success: boolean;
      agent: any;
    }>(`/api/agents/${id}`);
  }

  // Attendance APIs
  async getAgentAttendance(params?: {
    agentId?: string;
    month?: string;
    year?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      attendance: any[];
      statistics: {
        totalRecords: number;
        uniqueAgents: number;
        presentCount: number;
        halfDayCount: number;
        totalDuration: number;
        averageDuration: number;
      };
    }>(`/api/admin/attendance${queryString ? `?${queryString}` : ''}`);
  }

  async getAgentAttendanceById(agentId: string, params?: {
    month?: string;
    year?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      attendance: any[];
      statistics: {
        totalDays: number;
        presentDays: number;
        halfDays: number;
        totalHours: number;
      };
    }>(`/api/admin/attendance/${agentId}${queryString ? `?${queryString}` : ''}`);
  }

  async getUserAttendanceById(userId: string, params?: {
    month?: string;
    year?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      attendance: any[];
      statistics: {
        totalDays: number;
        presentDays: number;
        halfDays: number;
        totalHours: number;
      };
    }>(`/api/admin/users-attendance/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  // User Attendance APIs (for new unified system)
  async getUserAttendance(params?: {
    role?: 'agent' | 'employee';
    month?: string;
    year?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      attendance: any[];
      statistics: {
        totalRecords: number;
        uniqueUsers: number;
        presentCount: number;
        halfDayCount: number;
        totalDuration: number;
        averageDuration: number;
      };
    }>(`/api/admin/users-attendance${queryString ? `?${queryString}` : ''}`);
  }

  // Edit Request APIs
  async getPendingEditRequests() {
    return this.request<{
      success: boolean;
      vendors: any[];
      count: number;
    }>('/api/admin/edit-requests/pending');
  }

  async getUnreadEditRequestsCount() {
    return this.request<{
      success: boolean;
      count: number;
    }>('/api/admin/edit-requests/unread-count');
  }

  async markEditRequestsAsSeen() {
    return this.request<{
      success: boolean;
      message: string;
      modifiedCount: number;
    }>('/api/admin/edit-requests/mark-seen', {
      method: 'PATCH',
    });
  }

  async getUnreadVendorRequestsCount() {
    return this.request<{
      success: boolean;
      count: number;
    }>('/api/admin/vendors/unread-count');
  }

  async markVendorRequestsAsSeen() {
    return this.request<{
      success: boolean;
      message: string;
      modifiedCount: number;
    }>('/api/admin/vendors/mark-seen', {
      method: 'PATCH',
    });
  }

  async approveVendorEdit(vendorId: string, remark?: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/edit-requests/${vendorId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ remark }),
    });
  }

  async rejectVendorEdit(vendorId: string, remark?: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/edit-requests/${vendorId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ remark }),
    });
  }

  // Form Configuration APIs
  async getFormConfig(visibleTo?: string, vendorType?: string) {
    const queryParams = new URLSearchParams();
    if (visibleTo) queryParams.append('visibleTo', visibleTo);
    if (vendorType) queryParams.append('vendorType', vendorType);
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
    }>(`/api/form/config${queryString ? `?${queryString}` : ''}`);
  }

  async getAllSections() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/api/form/sections');
  }

  async createSection(sectionData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/form/sections', {
      method: 'POST',
      body: JSON.stringify(sectionData),
    });
  }

  async updateSection(sectionId: string, updateData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/form/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteSection(sectionId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/form/sections/${sectionId}`, {
      method: 'DELETE',
    });
  }

  async getFieldConfig(fieldId: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/api/form/fields/${fieldId}`);
  }

  async createFieldConfig(fieldData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/form/fields', {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
  }

  async updateFieldConfig(fieldId: string, updateData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/form/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteFieldConfig(fieldId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/form/fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  async updateFieldOrder(fields: Array<{ id: string; order: number }>) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/api/form/fields/reorder', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
  }

  // ==========================================
  // Vendor Type APIs
  // ==========================================
  async getVendorTypes(activeOnly?: boolean) {
    const queryString = activeOnly ? '?activeOnly=true' : '';
    return this.request<{
      success: boolean;
      data: VendorType[];
    }>(`/api/vendor-types${queryString}`);
  }

  async getVendorTypeById(id: string) {
    return this.request<{
      success: boolean;
      data: VendorType;
    }>(`/api/vendor-types/${id}`);
  }

  async createVendorType(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    order?: number;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: VendorType;
    }>('/api/vendor-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVendorType(id: string, data: Partial<VendorType>) {
    return this.request<{
      success: boolean;
      message: string;
      data: VendorType;
    }>(`/api/vendor-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVendorType(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/vendor-types/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderVendorTypes(orders: Array<{ id: string; order: number }>) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/api/vendor-types/reorder', {
      method: 'POST',
      body: JSON.stringify({ orders }),
    });
  }

  // ==========================================
  // PAYMENT APIs
  // ==========================================

  // Get payment configuration
  async getPaymentConfig() {
    return this.request<{
      success: boolean;
      config: PaymentConfig;
    }>('/api/payments/admin/payment-config');
  }

  // Update payment configuration
  async updatePaymentConfig(data: Partial<PaymentConfig>) {
    return this.request<{
      success: boolean;
      message: string;
      config: PaymentConfig;
    }>('/api/payments/admin/payment-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Update vendor payment status
  async updateVendorPaymentStatus(vendorId: string, data: {
    paymentCategory?: string;
    visitStatus?: string;
    followUpDate?: string;
    secondFollowUpDate?: string;
    remarks?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      vendor: any;
      newPayment: any;
      paymentCreated?: boolean;
      paymentAmount?: number;
      paymentType?: string;
    }>(`/api/payments/admin/vendors/${vendorId}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Get all payments
  async getPayments(params?: {
    status?: string;
    agentId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      payments: Payment[];
      stats: {
        pending: number;
        paid: number;
        pendingCount: number;
        paidCount: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/payments/admin/payments${queryString ? `?${queryString}` : ''}`);
  }

  // Get payments grouped by agent
  async getPaymentsByAgent(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      agents: AgentPaymentSummary[];
    }>(`/api/payments/admin/payments/by-agent${queryString ? `?${queryString}` : ''}`);
  }

  // Get single agent payment details
  async getAgentPaymentDetails(agentId: string) {
    return this.request<{
      success: boolean;
      agent: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        profileImage?: string;
        isActive: boolean;
        agentType?: string;
      };
      payments: Payment[];
      stats: {
        total: number;
        pending: number;
        paid: number;
        totalVendors: number;
        paymentCounts: {
          visit: number;
          followup: number;
          onboarding: number;
          balance: number;
        };
        vendorCounts: {
          visited: number;
          onboarded: number;
          rejected: number;
          followup: number;
        };
      };
      paymentConfig: PaymentConfig;
    }>(`/api/payments/admin/payments/agent/${agentId}`);
  }

  // Mark payments as paid
  async markPaymentsAsPaid(data: { paymentIds?: string[]; agentId?: string }) {
    return this.request<{
      success: boolean;
      message: string;
      modifiedCount: number;
    }>('/api/payments/admin/payments/mark-paid', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Update payment record
  async updatePayment(paymentId: string, data: {
    category?: string;
    paymentType?: string;
    amount?: number;
    paymentStatus?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      payment: Payment;
    }>(`/api/payments/admin/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete payment record
  async deletePayment(paymentId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/payments/admin/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  // Notification APIs
  async getNotifications(params?: {
    limit?: number;
    page?: number;
    isRead?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      data: {
        notifications: Notification[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
        unreadCount: number;
      };
    }>(`/api/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async getUnreadNotificationCount() {
    return this.request<{
      success: boolean;
      count: number;
    }>('/api/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: Notification;
    }>(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{
      success: boolean;
      message: string;
      modifiedCount: number;
    }>('/api/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async clearReadNotifications() {
    return this.request<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>('/api/notifications/clear-read', {
      method: 'DELETE',
    });
  }
}

// Payment interfaces
export interface PaymentConfig {
  _id?: string;
  categories: {
    A: { visit: number; followup: number; onboarding: number };
    B: { visit: number; followup: number; onboarding: number };
    C: { visit: number; followup: number; onboarding: number };
    D: { visit: number; followup: number; onboarding: number };
  };
  // Legacy flat format
  categoryA?: { visit: number; followup: number; onboarding: number };
  categoryB?: { visit: number; followup: number; onboarding: number };
  categoryC?: { visit: number; followup: number; onboarding: number };
  categoryD?: { visit: number; followup: number; onboarding: number };
  updatedBy?: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  agentId: string;
  agentName: string;
  vendorId: string;
  vendorName: string;
  category: string;
  paymentType: string;
  amount: number;
  visitStatus: string;
  paymentStatus: string;
  paidDate?: string;
  paidBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface AgentPaymentSummary {
  _id: string;
  agentName: string;
  totalAmount: number;
  vendorCount: number;
  pendingAmount: number;
  paidAmount: number;
}

// Vendor Type interface
export interface VendorType {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Notification interface
export interface Notification {
  _id: string;
  type: 'follow_up_update' | 'status_update';
  vendorId: {
    _id: string;
    restaurantName: string;
    restaurantStatus: 'pending' | 'publish' | 'reject';
  } | string;
  updatedBy: {
    userId: string;
    userName: string;
    userRole: 'agent' | 'employee';
  };
  title: string;
  message: string;
  followUpDate: {
    oldDate: string | null;
    newDate: string | null;
  };
  vendorDetails: {
    restaurantName: string;
    restaurantStatus: 'pending' | 'publish' | 'reject';
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = new ApiClient();

// Data normalization helpers
export function normalizeVendor(vendor: any) {
  // Flatten formData Map into the vendor object
  const formData = vendor.formData || {};
  
  return {
    ...vendor,
    ...formData, // Spread formData fields into the vendor object
    id: vendor._id || vendor.id,
    restaurantImage: typeof vendor.restaurantImage === 'object' 
      ? vendor.restaurantImage.secure_url 
      : vendor.restaurantImage,
    // Ensure arrays are always arrays (not undefined)
    categories: formData.categories || vendor.categories || [],
    services: formData.services || vendor.services || [],
    // Convert latitude and longitude to numbers for Google Maps
    latitude: parseFloat(vendor.latitude) || parseFloat(formData.latitude) || 0,
    longitude: parseFloat(vendor.longitude) || parseFloat(formData.longitude) || 0,
  };
}

export function normalizeVendors(vendors: any[]) {
  return vendors.map(normalizeVendor);
}
