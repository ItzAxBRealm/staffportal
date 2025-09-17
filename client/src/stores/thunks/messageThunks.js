import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { 
    startLoading, 
    setMessages, 
    addMessage, 
    updateMessage, 
    deleteMessage, 
    setError 
} from '../slices/messagesSlice';

export const getTicketMessages = createAsyncThunk(
  'messages/getTicketMessages',
  async (ticketId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get(`/api/messages/${ticketId}`);
      dispatch(setMessages(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch messages';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const createMessage = createAsyncThunk(
  'messages/createMessage',
  async ({ ticketId, content, attachments }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      
      const formData = new FormData();
      formData.append('content', content);
      formData.append('ticketId', ticketId);
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
          formData.append('attachments', attachment);
        });
      }
      
      const response = await api.post('/api/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      dispatch(addMessage(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create message';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const updateMessageContent = createAsyncThunk(
  'messages/updateMessage',
  async ({ messageId, content }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.patch(`/api/messages/${messageId}`, { content });
      dispatch(updateMessage(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update message';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const deleteMessageById = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      await api.delete(`/api/messages/${messageId}`);
      dispatch(deleteMessage(messageId));
      return messageId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete message';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);
