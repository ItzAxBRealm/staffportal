import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { loginSuccess } from '../../stores/slices/authSlice';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isAdmin, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated && user) {
          setChecking(false);
          return;
        }

        const tokenData = localStorage.getItem('accessToken');
        
        if (!tokenData) {
          localStorage.removeItem('userData');
          localStorage.removeItem('accessToken');
          dispatch({ type: 'auth/logout' });
          setChecking(false);
          return;
        }
        
        let token;
        try {
          const parsed = JSON.parse(tokenData);
          token = parsed.token;
        } 
        catch (e) {
          token = tokenData;
        }
        
        try {
          const response = await fetch('/api/users/current-user', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            const userData = result.data || result;
            userData.isAdmin = !!userData.isAdmin;
            localStorage.setItem('userData', JSON.stringify(userData));
            dispatch(loginSuccess(userData));
          } 
          else {
            console.warn('API verification failed: Invalid token or user deleted');
            localStorage.removeItem('userData');
            localStorage.removeItem('accessToken');
            dispatch({ type: 'auth/logout' });
          }
        } 
        catch (error) {
          console.warn('API verification failed:', error.message);
          localStorage.removeItem('userData');
          localStorage.removeItem('accessToken');
          dispatch({ type: 'auth/logout' });
        }
      } 
      finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [dispatch, isAuthenticated, isAdmin, user, adminOnly]); 

  if (checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Verifying access...</p>
      </div>
    );
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!isAuthenticated) {
    localStorage.removeItem('userData');
    localStorage.removeItem('accessToken');
    return <Navigate to="/login" replace />;  
  }

  return <Outlet />;
};

export default ProtectedRoute;
