import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const getAllAdmins = createAsyncThunk(
  'users/getAllAdmins',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/users/admins');
      return response.data.data; 
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch admin users';
      return rejectWithValue(message);
    }
  }
);

export const getAllUsers = createAsyncThunk(
  'users/getAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/users/all');
      return response.data.data; 
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch users';
      return rejectWithValue(message);
    }
  }
);
