/**
 * SAMARTH API Client
 * Seamless communication with Django REST Framework backend
 */

const rawBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
).trim();

// Normalize: remove trailing slash, and append /api if not already present
let cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
if (!cleanBaseUrl.endsWith('/api')) {
  cleanBaseUrl += '/api';
}
const BASE_URL = cleanBaseUrl;


function getHeaders() {
  const token = localStorage.getItem('samarth_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...getHeaders(),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      let message = 'An error occurred';
      if (typeof data === 'object') {
        if (data.detail) {
          message = data.detail;
        } else {
          // Flatten field error messages
          message = Object.entries(data)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ');
        }
      }
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  auth: {
    login: (username, password) => request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    register: (userData) => request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    me: () => request('/auth/me/'),
    logout: () => request('/auth/logout/', { method: 'POST' }),
  },

  // Categories
  categories: {
    list: () => request('/categories/'),
  },

  // Workers
  workers: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/workers/${q ? '?' + q : ''}`);
    },
    get: (id) => request(`/workers/${id}/`),
    myProfile: () => request('/workers/my_profile/'),
    toggleAvailability: () => request('/workers/toggle_availability/', { method: 'POST' }),
    reviews: (workerId) => request(`/workers/${workerId}/reviews/`),
  },

  // Job Requests
  jobRequests: {
    list: () => request('/job-requests/'),
    get: (id) => request(`/job-requests/${id}/`),
    create: (data) => request('/job-requests/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    matchedWorkers: (id) => request(`/job-requests/${id}/matched_workers/`),
  },

  // Quotes
  quotes: {
    list: (jobRequestId = null) => {
      const q = jobRequestId ? `?job_request=${jobRequestId}` : '';
      return request(`/quotes/${q}`);
    },
    create: (quoteData) => request('/quotes/', {
      method: 'POST',
      body: JSON.stringify(quoteData)
    }),
    approve: (quoteId) => request(`/quotes/${quoteId}/approve/`, { method: 'POST' }),
  },

  // Bookings
  bookings: {
    list: () => request('/bookings/'),
    get: (id) => request(`/bookings/${id}/`),
    start: (id) => request(`/bookings/${id}/start_job/`, { method: 'POST' }),
    complete: (id) => request(`/bookings/${id}/complete_job/`, { method: 'POST' }),
    cancel: (id, reason) => request(`/bookings/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  },

  // Reviews
  reviews: {
    create: (data) => request('/reviews/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },

  // Admin Operations
  admin: {
    stats: () => request('/admin-ops/stats/'),
    verifications: () => request('/admin-ops/verifications/'),
    verifyWorker: (workerId, action, remarks) => request('/admin-ops/verify_worker/', {
      method: 'POST',
      body: JSON.stringify({
        worker_id: workerId,
        action,
        remarks
      })
    }),
  }
};
