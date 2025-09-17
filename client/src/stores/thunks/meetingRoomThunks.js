import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { 
    startLoading, 
    setBookings, 
    setCurrentBooking, 
    setUserBookings,
    addBooking, 
    updateBooking, 
    removeBooking,
    setAvailability,
    setError 
} from '../slices/meetingRoomSlice';

export const fetchBookings = createAsyncThunk(
  'meetingRoom/fetchBookings',
  async (params = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.department) queryParams.append('department', params.department);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const response = await api.get(`/api/meetingRoom?${queryParams}`);
      dispatch(setBookings(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch bookings';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'meetingRoom/fetchBookingById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get(`/api/meetingRoom/${id}`);
      dispatch(setCurrentBooking(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch booking';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Create new booking
export const createBooking = createAsyncThunk(
  'meetingRoom/createBooking',
  async (bookingData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post('/api/meetingRoom', bookingData);
      dispatch(addBooking(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create booking';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Update booking
export const updateBookingById = createAsyncThunk(
  'meetingRoom/updateBooking',
  async ({ id, updateData }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.patch(`/api/meetingRoom/${id}`, updateData);
      dispatch(updateBooking(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update booking';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Delete booking
export const deleteBookingById = createAsyncThunk(
  'meetingRoom/deleteBooking',
  async ({ id, deleteRecurring = false }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const queryParams = deleteRecurring ? '?deleteRecurring=true' : '';
      const response = await api.delete(`/api/meetingRoom/${id}${queryParams}`);
      dispatch(removeBooking(id));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete booking';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Get user bookings
export const fetchUserBookings = createAsyncThunk(
  'meetingRoom/fetchUserBookings',
  async ({ userId, upcoming = true, page = 1, limit = 20 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const queryParams = new URLSearchParams({
        upcoming: upcoming.toString(),
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await api.get(`/api/meetingRoom/user/${userId}?${queryParams}`);
      dispatch(setUserBookings(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch user bookings';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Check availability
export const checkAvailability = createAsyncThunk(
  'meetingRoom/checkAvailability',
  async ({ startTime, endTime, excludeId }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const queryParams = new URLSearchParams({
        startTime: startTime,
        endTime: endTime
      });
      
      if (excludeId) {
        queryParams.append('excludeId', excludeId);
      }
      
      const response = await api.get(`/api/meetingRoom/check-availability?${queryParams}`);
      dispatch(setAvailability(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to check availability';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Delete booking
export const deleteBooking = createAsyncThunk(
  'meetingRoom/deleteBooking',
  async ({ bookingId, deleteRecurring = false }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const queryParams = deleteRecurring ? '?deleteRecurring=true' : '';
      await api.delete(`/api/meetingRoom/${bookingId}${queryParams}`);
      
      // Remove from local state
      dispatch(removeBooking(bookingId));
      return { bookingId, deleteRecurring };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete booking';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Convenience exports
export const getBookings = fetchBookings;
export const getBookingById = fetchBookingById;
export const getUserBookings = fetchUserBookings;
