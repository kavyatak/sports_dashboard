import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// ── Attach JWT token to every request if available ────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const register  = (data) => API.post('/auth/register', data);
export const login     = (data) => API.post('/auth/login', data);
export const getMe     = ()     => API.get('/auth/me');

export const getMatches      = (params) => API.get('/matches', { params });
export const createMatch     = (data)   => API.post('/matches', data);
export const updateMatch     = (id, data) => API.put(`/matches/${id}`, data);
export const deleteMatch     = (id)     => API.delete(`/matches/${id}`);

export const getOverview     = (params) => API.get('/stats/overview', { params });
export const getTeamStats    = (params) => API.get('/stats/teams',    { params });
export const getPlayerStats  = (params) => API.get('/stats/players',  { params });
export const getVenueStats   = (params) => API.get('/stats/venues',   { params });
export const getH2H          = (params) => API.get('/stats/h2h',      { params });
export const getTimeline     = (params) => API.get('/stats/timeline',  { params });
export const getPredict      = (params) => API.get('/stats/predict',   { params });

export const getUpcoming     = (params) => API.get('/upcoming', { params });
export const createUpcoming  = (data)   => API.post('/upcoming', data);
export const deleteUpcoming  = (id)     => API.delete(`/upcoming/${id}`);

export const getOptions      = ()       => API.get('/options');
export const triggerSync     = ()       => API.post('/sync');

export const getLive         = ()       => API.get('/live');
export const getCredits      = ()       => API.get('/credits');

