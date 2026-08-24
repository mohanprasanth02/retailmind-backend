export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('retailmind_backend_url');
    if (custom && custom.trim().length > 0 && !custom.endsWith('retailmind-backend.onrender.com')) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return (import.meta.env.VITE_API_URL || 'https://retailmind-backend-698m.onrender.com').replace(/\/+$/, '');
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem('retailmind_backend_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('retailmind_backend_url');
    }
  }
};

export const API_BASE_URL = {
  toString() {
    return getApiBaseUrl();
  }
};
