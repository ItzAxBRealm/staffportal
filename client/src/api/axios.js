import axios from 'axios';
import store from '../stores/store';
import { logout } from '../stores/slices/authSlice';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } 
  return config;
});

api.interceptors.request.use(
  (config) => {
    const tokenData = localStorage.getItem('accessToken');
    
    if (tokenData) {
      try {
        let token;
        let isExpired = false;
        
        try {
          const parsedToken = JSON.parse(tokenData);
          const { token: parsedTokenValue, expiry } = parsedToken;
          
          if (expiry && new Date().getTime() > expiry + (5 * 60 * 1000)) {
            isExpired = true;
          } 
          
          token = parsedTokenValue;
        } 
        catch (parseError) {
          token = tokenData;
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } 
      } 
      catch (e) {
        console.error('Error processing auth token:', e);
      }
    } 
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    const redirectCounter = sessionStorage.getItem('redirect_counter') || '0';
    const currentRedirectCount = parseInt(redirectCounter, 10);
    
    if (currentRedirectCount > 2) {
      console.warn('Too many redirects detected. Forcing logout.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('redirect_counter');
      store.dispatch(logout());
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication failed after multiple attempts'));
    }
    
    if (error.response?.status === 401 && !originalRequest._retry && 
        !originalRequest.url?.includes('refresh-token') &&
        !originalRequest.url?.includes('/users/current-user') &&
        !window.location.pathname.includes('/login')) {
      
      originalRequest._retry = true;
      
      try {
        const response = await axios.post('/api/users/refresh-token', {}, { 
          withCredentials: true
        });
        
        const { accessToken } = response.data.data;
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 8);
        const tokenData = {
          token: accessToken,
          expiry: expiryTime.getTime()
        };
        
        localStorage.setItem('accessToken', JSON.stringify(tokenData));
        originalRequest.headers.Authorization = `Bearer ${tokenData.token}`;
        return api(originalRequest);
      } 
      catch (refreshError) {
        console.error('Token refresh failed');
        localStorage.removeItem('accessToken');
        store.dispatch(logout());
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      }
    }
    
    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.error('No Access');
          break;
        case 404:
          console.error('Not Found');
          break;
        case 500:
          console.error('500 - Server Error');
          break;
        default:
          console.error(`Status: ${error.response.status}`);
      }
    } 
    else if (error.request) {
      console.error('No server response');
    } 
    else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const uploadFile = async (url, formData, onProgress = null) => {
  try {
    let totalSize = 0;
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        totalSize += value.size;
        
        if (value.size > 8 * 1024 * 1024) { 
          return { 
            success: false, 
            error: 'file_too_large', 
            message: `File ${value.name} exceeds the 8MB size limit`
          };
        }
      }
    }
    
    if (totalSize > 15 * 1024 * 1024) { 
      return {
        success: false,
        error: 'total_size_exceeded',
        message: 'Total file size exceeds the 15MB limit'
      };
    }
    
    const tokenData = localStorage.getItem('accessToken');
    let token = '';
    if (tokenData) {
      try {
        const parsedToken = JSON.parse(tokenData);
        token = parsedToken.token;
      } 
      catch (e) {
        token = tokenData;
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData, 
      credentials: 'include',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Server error: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } 
      catch (e) {
        if (errorText) errorMessage = errorText;
      }
      
      if (response.status === 413) {
        return {
          success: false,
          error: 'server_file_too_large',
          message: 'File is too large for the server to process'
        };
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return { success: true, data };
  } 
  catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Upload failed: ' + error.message
    };
  }
};

export default api;
