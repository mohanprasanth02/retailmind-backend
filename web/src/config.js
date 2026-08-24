export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('retailmind_backend_url');
    // Ignore legacy or local URLs when hosted on Vercel / production domain
    if (custom && custom.trim().length > 0) {
      const clean = custom.trim().replace(/\/+$/, '');
      if (clean.includes('retailmind-backend-698m.onrender.com')) {
        return clean;
      }
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
