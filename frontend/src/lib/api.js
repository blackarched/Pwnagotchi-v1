// api.js (Production-Ready: Only Real API Calls)

// Vite uses import.meta.env for environment variables
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper for GET requests
async function get(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

// Helper for POST requests
async function post(endpoint, data = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

// Device state
export const fetchState = () => get('/v1/data');
export const fetchNetworks = (params) => get('/v1/units', params);
export const fetchHandshakes = () => get('/v1/data'); // Adjust endpoint as needed
export const fetchLogs = () => get('/v1/logs'); // Adjust endpoint as needed
export const fetchPlugins = () => get('/v1/plugins'); // Adjust endpoint as needed
export const fetchConfig = () => get('/v1/config'); // Adjust endpoint as needed

// Actions
export const sendCommand = (command) => post('/v1/command', { command });
export const updatePlugin = (plugin, enabled) => post('/v1/plugins', { plugin, enabled });
export const saveConfig = (config) => post('/v1/config', config);
export const startDeauthAttack = (target) => post('/v1/attack/deauth', { target });

// Inbox
export const fetchInbox = () => get('/v1/inbox');
export const fetchInboxItem = (id) => get(`/v1/inbox/${id}`);
export const markInboxItem = (id, mark) => get(`/v1/inbox/${id}/${mark}`);
export const sendInboxMessage = (fingerprint, data) => post(`/v1/unit/${fingerprint}/inbox`, data);
