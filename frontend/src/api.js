/**
 * Botivate HR Support - API Client
 * Centralized Axios instance for all backend communication.
 */

import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('botivate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('botivate_token');
      localStorage.removeItem('botivate_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Company APIs ─────────────────────────────────────────

export const companyAPI = {
  register: (data) => api.post('/companies/register', data),
  getAll: () => api.get('/companies/'),
  getById: (id) => api.get(`/companies/${id}`),
  getSupport: (id) => api.get(`/companies/${id}/support`),
  addTextPolicy: (companyId, data) => api.post(`/companies/${companyId}/policies/text`, data),
  uploadDocPolicy: (companyId, formData) =>
    api.post(`/companies/${companyId}/policies/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPolicies: (companyId) => api.get(`/companies/${companyId}/policies`),
  deletePolicy: (companyId, policyId) => api.delete(`/companies/${companyId}/policies/${policyId}`),
  addDatabase: (companyId, data) => api.post(`/companies/${companyId}/databases`, data),
  getDatabases: (companyId) => api.get(`/companies/${companyId}/databases`),
  provisionEmployees: (companyId, dbId) =>
    api.post(`/companies/${companyId}/databases/${dbId}/provision`),
};

// ── Auth APIs ────────────────────────────────────────────

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

// ── Chat APIs ────────────────────────────────────────────

export const chatAPI = {
  send: (data) => api.post('/chat/send', data),
};

// ── Approval APIs ────────────────────────────────────────

export const approvalAPI = {
  getPending: () => api.get('/approvals/pending'),
  getMyRequests: () => api.get('/approvals/my-requests'),
  decide: (requestId, data) => api.post(`/approvals/${requestId}/decide`, data),
};

// ── Notification APIs ────────────────────────────────────

export const notificationAPI = {
  getAll: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
};
