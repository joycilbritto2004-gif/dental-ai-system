const API_URL = 'http://localhost:5000/api/auth';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  },

  register: async (name, email, password, role, phone) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, phone }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw error;
    }
  },
};
