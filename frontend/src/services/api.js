const API_URL = 'http://localhost:5000/api/auth';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  login: async (email, password, loginRole) => {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, loginRole }),
      });
      return await handleResponse(response);
  },

  register: async (name, email, password, role, phone) => {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, phone }),
      });
      return await handleResponse(response);
  },
};

export const initApiInterceptor = () => {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    
    // Only intercept requests to our API
    if (typeof resource === 'string' && resource.startsWith('http://localhost:5000/api')) {
      // Do not attach token for auth endpoints
      if (!resource.includes('/auth/login') && !resource.includes('/auth/register')) {
        const token = localStorage.getItem('dentaai_token');
        if (token) {
          config = config || {};
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
        }
      }
    }

    try {
      const response = await originalFetch(resource, config);
      
      // Handle 401 globally without infinite loops
      if (response.status === 401 && window.location.pathname !== '/login') {
        localStorage.removeItem('dentaai_token');
        localStorage.removeItem('dentaai_user');
        window.location.href = '/login';
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
};
