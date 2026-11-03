// Single source of truth for the backend origin.
//
// Set VITE_API_URL in the deployment environment (e.g. Vercel project settings) to the
// public URL of the Node/Express API. Without it, every request would go to the
// visitor's own machine, which is why the hosted build could not reach the backend.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Socket.IO connects to the same origin as the REST API.
export const SOCKET_URL = API_BASE;
