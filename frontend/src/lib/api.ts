const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export interface User {
  id: string;
  full_name: string;
  student_number: string;
  course: string;
  section: string;
  year_level: string;
  personal_email: string;
  plv_email: string;
  role: 'student' | 'admin' | 'masteradmin';
  status: 'pending' | 'active' | 'archived' | 'deactivated' | 'rejected' | 'offline';
  admin_approved: boolean;
  email_verified: boolean;
  avatar_url?: string;
  gender?: string;
  birthdate?: string;
  address?: string;
  phone?: string;
}

export interface Research {
  id: string;
  title: string;
  category: string;
  abstract: string;
  researchers: string[];
  pdf_url: string;
  thumbnail_url: string;
  uploaded_by: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejection_reason?: string;
  deleted_at?: string;
  created_at: string;
  author_name?: string;
  is_featured?: boolean;
  school_year_label?: string;
  awards?: Array<{ id: string; title: string; icon: string; color?: string }>;
  course?: string;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    credentials: 'include',
  });

  if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/me')) {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    window.location.href = isAdminRoute ? '/admin/login' : '/login';
    throw new Error('Session expired. Please login again.');
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    if (res.status >= 400) {
      throw new Error(`Server Error (${res.status}): ${res.statusText}`);
    }
    throw new Error('Invalid server response format. Please try again later.');
  }

  if (!res.ok) throw data;
  return data;
}

export const api = {
  // Auth
  getMe: () => request('/auth/me'),
  getConfig: () => request('/config'),
  login: (body: any) => request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  register: (body: any) => request('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  verifyOtp: (body: any) => request('/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  resendOtp: (body: any) => request('/auth/resend-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  forgotPassword: (body: any) => request('/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  resetPassword: (body: any) => request('/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  getPublicSelectibles: () => request('/auth/selectibles'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Research
  getResearch: (status?: string) => request(`/research${status ? `?status=${status}` : ''}`),
  getResearchDetail: (id: string) => request(`/research/${id}`),
  searchResearch: (params: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/research/search?${q}`);
  },
  uploadResearch: (formData: FormData) => request('/research', { method: 'POST', body: formData }),
  getMyUploads: () => request('/research/my/uploads'),
  getPublicFeatured: () => request('/research/featured'),
  listAwards: () => request('/research/awards/list'),
  deleteResearch: (id: string) => request(`/research/${id}/delete`, { method: 'PUT' }),
  restoreResearch: (id: string) => request(`/research/${id}/restore`, { method: 'PUT' }),
  permanentDeleteResearch: (id: string) => request(`/research/${id}/permanent-delete`, { method: 'DELETE' }),
  permanentlyDeleteResearch: (id: string) => request(`/research/${id}/permanent-delete`, { method: 'DELETE' }),

  // Admin
  getRegistrations: (status?: string) => request(`/admin/registrations${status ? `?status=${status}` : ''}`),
  approveRegistration: (id: string) => request(`/admin/registrations/${id}/approve`, { method: 'PUT' }),
  rejectRegistration: (id: string, reason: string) => request(`/admin/registrations/${id}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }),
  getAllUploads: (status?: string) => request(`/admin/uploads${status ? `?status=${status}` : ''}`),
  acceptUpload: (id: string) => request(`/admin/uploads/${id}/accept`, { method: 'PUT' }),
  rejectUpload: (id: string, reason: string) => request(`/admin/uploads/${id}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }),

  // Settings & Management
  getPendingCount: () => request('/admin/pending-count'),
  getSettings: () => request('/admin/settings'),
  updateSettings: (body: any) => request('/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

  getSelectibles: () => request('/admin/selectibles'),
  addSelectible: (body: any) => request('/admin/selectibles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  updateSelectible: (id: string, body: any) => request(`/admin/selectibles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  deleteSelectible: (id: string) => request(`/admin/selectibles/${id}`, { method: 'DELETE' }),

  getAdmins: () => request('/admin/admins'),
  createAdmin: (body: any) => request('/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  updateAdmin: (id: string, body: any) => request(`/admin/admins/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  deleteAdmin: (id: string) => request(`/admin/admins/${id}`, { method: 'DELETE' }),

  getYears: () => request('/admin/years'),
  addYear: (body: any) => request('/admin/years', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  updateYear: (id: string, body: any) => request(`/admin/years/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  deleteYear: (id: string) => request(`/admin/years/${id}`, { method: 'DELETE' }),

  getAwards: () => request('/admin/awards'),
  getAwardResearches: (id: string) => request(`/admin/awards/${id}/researches`),
  addAward: (body: any) => request('/admin/awards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  deleteAward: (id: string) => request(`/admin/awards/${id}`, { method: 'DELETE' }),

  getActivityLog: (filters: any = {}) => {
    const q = new URLSearchParams(filters).toString();
    return request(`/admin/activity-log${q ? `?${q}` : ''}`);
  },

  getAnnouncements: () => request('/admin/announcements'),
  createAnnouncement: (body: any) => request('/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  deleteAnnouncement: (id: string) => request(`/admin/announcements/${id}`, { method: 'DELETE' }),

  getFeaturedResearch: () => request('/admin/featured'),
  toggleFeatured: (id: string) => request(`/admin/research/${id}/feature`, { method: 'PUT' }),
  getDeletedResearch: () => request('/admin/deleted-research'),
  restoreDeleted: (id: string) => request(`/admin/research/${id}/restore`, { method: 'PUT' }),

  batchDeactivate: (ids: string[]) => request('/admin/users/batch-deactivate', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
  batchReactivate: (ids: string[]) => request('/admin/users/batch-reactivate', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
  batchArchive: (ids: string[]) => request('/admin/users/batch-archive', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
  batchDelete: (ids: string[]) => request('/admin/users/batch-delete', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
  updateResearchAdmin: (id: string, body: any) => request(`/admin/research/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

  bestowAward: (researchId: string, awardId: string) => request(`/admin/research/${researchId}/awards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ award_id: awardId }),
  }),
  unawardResearch: (researchId: string, awardId: string) => request(`/admin/research/${researchId}/awards/${awardId}`, { method: 'DELETE' }),

  manualRegister: (body: any) => request('/admin/manual-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  changePassword: (body: any) => request('/admin/change-password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

  // Inbox
  getInbox: () => request('/inbox'),
  getUnreadCount: () => request('/inbox/unread-count'),
  markRead: (id: string) => request(`/inbox/${id}/read`, { method: 'PUT' }),

  // User Management
  getUsers: (search?: string, status?: string) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    const qs = q.toString();
    return request(`/users${qs ? `?${qs}` : ''}`);
  },
  getUser: (id: string) => request(`/users/${id}`),
  updateUser: (id: string, body: any) => request(`/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  updateUserStatus: (id: string, status: string) => request(`/users/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  archiveUser: (id: string) => request(`/users/${id}/archive`, { method: 'PUT' }),
  deactivateUser: (id: string) => request(`/users/${id}/deactivate`, { method: 'PUT' }),

  // Bookmarks
  getMyBookmarks: () => request('/research/my/bookmarks'),
  toggleBookmark: (researchId: string) => request(`/bookmarks/${researchId}`, { method: 'POST' }),
};
