import { loginSuccess } from '../stores/slices/authSlice';
import api from '../api/axios';


export const initializeAuth = async (store) => {
  try {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        store.dispatch(loginSuccess(userData));
        return;
      } 
      catch (e) {
        console.error('Failed to parse user data from localStorage:', e);
      }
    }
  } 
  catch (error) {
    console.error('Auth initialization error:', error);
  }
};
