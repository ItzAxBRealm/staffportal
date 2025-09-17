export const localStorageUtil = {
  set: (key, value, expirySeconds) => {
    try {
      const item = {
        value,
        expiry: expirySeconds ? Date.now() + (expirySeconds * 1000) : null
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } 
    catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      const item = JSON.parse(itemStr);
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } 
    catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } 
    catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } 
    catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }
};

export const sessionStorageUtil = {
  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } 
    catch (error) {
      console.error('SessionStorage set error:', error);
      return false;
    }
  },
  
  get: (key) => {
    try {
      const itemStr = sessionStorage.getItem(key);
      if (!itemStr) return null;
      return JSON.parse(itemStr);
    } 
    catch (error) {
      console.error('SessionStorage get error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } 
    catch (error) {
      console.error('SessionStorage remove error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } 
    catch (error) {
      console.error('SessionStorage clear error:', error);
      return false;
    }
  }
};

export const cookieUtil = {
  set: (name, value, options = {}) => {
    try {
      const { 
        days = 7,
        path = '/',
        domain = '',
        secure = false,
        sameSite = 'strict' 
      } = options;
      
      const expires = new Date(Date.now() + days * 86400000).toUTCString();
      let cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}`;
      
      if (domain) cookie += `; domain=${domain}`;
      if (secure) cookie += '; secure';
      if (sameSite) cookie += `; samesite=${sameSite}`;
      
      document.cookie = cookie;
      return true;
    } 
    catch (error) {
      console.error('Cookie set error:', error);
      return false;
    }
  },
  
  get: (name) => {
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return decodeURIComponent(cookie.substring(name.length + 1));
        }
      }
      return null;
    } 
    catch (error) {
      console.error('Cookie get error:', error);
      return null;
    }
  },
  
  remove: (name, options = {}) => {
    try {
      const { path = '/', domain = '' } = options;
      let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
      if (domain) cookie += `; domain=${domain}`;
      document.cookie = cookie;
      return true;
    } 
    catch (error) {
      console.error('Cookie remove error:', error);
      return false;
    }
  }
};

export default {
  local: localStorageUtil,
  session: sessionStorageUtil,
  cookie: cookieUtil
};
