import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { 
    startLoading, 
    setFaqs, 
    setCurrentFaq, 
    setError, 
    addFaq, 
    updateFaq, 
    deleteFaq 
} from '../slices/faqSlice';

export const getAllFaqs = createAsyncThunk(
  'faqs/getAllFaqs',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get('/api/faqs');
      dispatch(setFaqs(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch FAQs';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const getFaqById = createAsyncThunk(
  'faqs/getFaqById',
  async (faqId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get(`/api/faqs/${faqId}`);
      dispatch(setCurrentFaq(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch FAQ';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const createFaq = createAsyncThunk(
  'faqs/createFaq',
  async (faqData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post('/api/faqs', faqData);
      dispatch(addFaq(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create FAQ';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const updateFaqById = createAsyncThunk(
  'faqs/updateFaq',
  async ({ faqId, updateData }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.patch(`/api/faqs/${faqId}`, updateData);
      dispatch(updateFaq(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update FAQ';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const deleteFaqById = createAsyncThunk(
  'faqs/deleteFaq',
  async (faqId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      await api.delete(`/api/faqs/${faqId}`);
      dispatch(deleteFaq(faqId));
      return faqId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete FAQ';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);
