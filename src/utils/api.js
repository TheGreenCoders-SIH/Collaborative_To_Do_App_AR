import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken })
};

export const users = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/profile/password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  search: (query) => api.get(`/users/search?query=${encodeURIComponent(query)}`)
};

export const friends = {
  list: () => api.get('/friends'),
  pending: () => api.get('/friends/pending'),
  sent: () => api.get('/friends/sent'),
  request: (addressee_id) => api.post('/friends/request', { addressee_id }),
  respond: (friendship_id, action) => api.put('/friends/respond', { friendship_id, action }),
  remove: (friendId) => api.delete(`/friends/${friendId}`),
  check: (userId) => api.get(`/friends/check/${userId}`)
};

export const teams = {
  create: (data) => api.post('/teams', data),
  getAll: () => api.get('/teams'),
  getOne: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (id, email) => api.post(`/teams/${id}/members`, { email }),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
  getMembers: (id) => api.get(`/teams/${id}/members`),
  getChannels: (teamId) => api.get(`/teams/${teamId}/channels`),
  createChannel: (teamId, data) => api.post(`/teams/${teamId}/channels`, data)
};

export const channels = {
  join: (channelId) => api.post(`/channels/${channelId}/join`),
  leave: (channelId) => api.post(`/channels/${channelId}/leave`),
  getMembers: (channelId) => api.get(`/channels/${channelId}/members`)
};

export const tasks = {
  create: (teamId, data) => api.post(`/teams/${teamId}/tasks`, data),
  getAll: (teamId, params) => api.get(`/teams/${teamId}/tasks`, { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
  assign: (id, userId) => api.post(`/tasks/${id}/assign`, { user_id: userId }),
  unassign: (id, userId) => api.delete(`/tasks/${id}/assign/${userId}`),
  approve: (id, approve, reason) => api.post(`/tasks/${id}/approve`, { approve, reason })
};

export const comments = {
  add: (taskId, content) => api.post(`/tasks/${taskId}/comments`, { content }),
  getAll: (taskId) => api.get(`/tasks/${taskId}/comments`),
  delete: (id) => api.delete(`/comments/${id}`)
};

export const attachments = {
  upload: (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  get: (id) => api.get(`/attachments/${id}`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/attachments/${id}`)
};

export const activity = {
  getTeamActivity: (teamId, params) => api.get(`/teams/${teamId}/activity`, { params }),
  getUpdates: (teamId, since) => api.get(`/teams/${teamId}/updates`, { params: { since } }),
  getMetrics: (teamId) => api.get(`/teams/${teamId}/metrics`)
};

export const messaging = {
  getConversations: () => api.get('/messages/conversations'),
  createConversation: (userId) => api.post('/messages/conversations', { user_id_2: userId }),
  getMessages: (conversationId, limit = 100) => api.get(`/messages/conversations/${conversationId}/messages?limit=${limit}`),
  sendMessage: (conversationId, content, nonce) => api.post('/messages/messages', { conversation_id: conversationId, encrypted_content: content, nonce }),
  markRead: (messageId) => api.post(`/messages/messages/${messageId}/read`),
  getTeamMessages: (teamId, limit = 100) => api.get(`/messages/team/${teamId}?limit=${limit}`),
  sendTeamMessage: (teamId, content) => api.post(`/messages/team/${teamId}`, { content }),
};

export default api;