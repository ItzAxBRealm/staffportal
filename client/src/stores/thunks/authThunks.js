import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { loginStart, loginSuccess, loginFailure, logout, updateUser } from '../slices/authSlice';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      const response = await api.post('/api/users/login', credentials);
      const { user, accessToken } = response.data.data;
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 8);
      const tokenData = {
        token: accessToken,
        expiry: expiryTime.getTime()
      };
      localStorage.setItem('accessToken', JSON.stringify(tokenData));
      localStorage.setItem('userData', JSON.stringify(user));
      sessionStorage.removeItem('redirect_counter');
      dispatch(loginSuccess(user));
      return user;
    } 
    catch (error) {
      const statusCode = error.response?.status;
      let message = 'Login failed. Please try again.';
      if (statusCode === 401) {
        message = 'Invalid credentials. Please check your email and password.';
      } 
      else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      dispatch(loginFailure(message));
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const transformedData = {
        fullName: userData.fullName,
        email: userData.email,
        username: userData.username,
        password: userData.password,
        phoneNumber: userData.phoneNumber,
        jobRole: userData.jobRole,
      };
      const response = await api.post('/api/users/register', transformedData);
      return { success: true, data: response.data.data };
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed';
      let status = error.response?.status;
      let isAdminRequired = status === 401 && message.includes('admin');
      return rejectWithValue({ 
        success: false, 
        error: message,
        message: message,
        status,
        isAdminRequired,
        originalError: error.response?.data
      });
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(loginStart());
      const response = await api.get('/api/users/current-user');
      dispatch(loginSuccess(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to get user';
      dispatch(loginFailure(message));
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('redirect_counter');
      dispatch(logout());
      try {
        await api.post('/api/users/logout');
      } 
      catch (logoutError) {
        console.warn('Backend logout failed, but local cleanup completed:', logoutError.message);
      }
      
      return { success: true };
    } 
    catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('redirect_counter');
      dispatch(logout());
      
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Logout failed';
      return rejectWithValue(message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch('/api/users/update-profile', userData);
      dispatch(updateUser(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Profile update failed';
      return rejectWithValue(message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/api/users/change-password', passwordData);
      return response.data.data;
    } 
    catch (error) {
      let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Password change failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } 
      else if (error.response?.status === 400) {
        errorMessage = 'All fields are required and must be valid';
      } 
      else if (error.response?.status === 401) {
        errorMessage = 'Current password is incorrect';
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const createUser = createAsyncThunk(
  'auth/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const transformedData = {
        fullName: userData.fullName,
        email: userData.email,
        username: userData.username,
        password: userData.password,
        phoneNumber: userData.phoneNumber,
        jobRole: userData.jobRole,
      };
      
      const response = await api.post('/api/users/create-user', transformedData);
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'User creation failed';
      return rejectWithValue(message);
    }
  }
);

export const toggleUserAdmin = createAsyncThunk(
  'auth/toggleAdmin',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/users/admin/toggle-admin/${userId}`);
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update admin status';
      return rejectWithValue(message);
    }
  }
);

export const updatePhoneNumber = createAsyncThunk(
  'auth/updatePhoneNumber',
  async (phoneNumber, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch('/api/users/update-phone', { phoneNumber });
      dispatch(updateUser(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update phone number';
      return rejectWithValue(message);
    }
  }
);
