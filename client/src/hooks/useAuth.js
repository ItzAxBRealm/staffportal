import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getCurrentUser 
} from '../stores/thunks/authThunks';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error, isAdmin } = useSelector(state => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  const login = useCallback(async (credentials) => {
    try {
      const resultAction = await dispatch(loginUser(credentials));
      if (loginUser.fulfilled.match(resultAction)) {
        navigate('/dashboard');
        return { success: true };
      } 
      else {
        return { 
          success: false, 
          error: resultAction.payload || 'Login failed' 
        };
      }
    } 
    catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }, [dispatch, navigate]);

  const register = useCallback(async (userData) => {
    try {
      const resultAction = await dispatch(registerUser(userData));
      if (registerUser.fulfilled.match(resultAction)) {
        navigate('/login');
        return { success: true };
      } 
      else {
        return { 
          success: false, 
          error: resultAction.payload || 'Registration failed' 
        };
      }
    } 
    catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  }, [dispatch, navigate]);

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    navigate('/login');
  }, [dispatch, navigate]);

  return {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    login,
    register,
    logout
  };
};

export default useAuth;
