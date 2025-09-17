
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:8080'; 
export const config = {
  API_BASE_URL,
  UPLOADS_URL: `${API_BASE_URL}/uploads`
};

export default config;
