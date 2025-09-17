import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { 
    startLoading, 
    setAnnouncements, 
    setCurrentAnnouncement, 
    setError, 
    addAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
} from '../slices/announcementSlice';

export const getAllAnnouncements = createAsyncThunk(
  'announcements/getAllAnnouncements',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get('/api/announcements');
      dispatch(setAnnouncements(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch announcements';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const getAnnouncements = getAllAnnouncements;

export const getAnnouncementById = createAsyncThunk(
  'announcements/getAnnouncementById',
  async (announcementId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get(`/api/announcements/${announcementId}`);
      dispatch(setCurrentAnnouncement(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch announcement';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'announcements/createAnnouncement',
  async (announcementData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post('/api/announcements', announcementData);
      dispatch(addAnnouncement(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create announcement';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const updateAnnouncementById = createAsyncThunk(
  'announcements/updateAnnouncement',
  async ({ announcementId, updateData }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.patch(`/api/announcements/${announcementId}`, updateData);
      dispatch(updateAnnouncement(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update announcement';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const deleteAnnouncementById = createAsyncThunk(
  'announcements/deleteAnnouncement',
  async (announcementId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      await api.delete(`/api/announcements/${announcementId}`);
      dispatch(deleteAnnouncement(announcementId));
      return announcementId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete announcement';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);
