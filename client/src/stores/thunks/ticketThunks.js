import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { uploadFile } from '../../api/axios';
import { toast } from 'sonner';
import { 
    startLoading, 
    setUserTickets, 
    setAllTickets, 
    setCurrentTicket, 
    setError, 
    createTicket as addTicket,
    updateTicket as editTicket,
    deleteTicket as removeTicket,
    addReply,
    assignTicket as setAssignedAdmin
} from '../slices/ticketSlice';

export const getUserTickets = createAsyncThunk(
  'tickets/getUserTickets',
  async (status, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get(`/api/tickets${status ? `?status=${status}` : ''}`);
      dispatch(setUserTickets(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      console.error('Ticket fetch error:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch tickets';
      dispatch(setError(message));
      dispatch(setUserTickets([]));
      return rejectWithValue(message);
    }
  }
);

export const getAllTickets = createAsyncThunk(
  'tickets/getAllTickets',
  async (status, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get(`/api/tickets${status ? `?status=${status}` : ''}`);
      dispatch(setAllTickets(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch all tickets';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const getTicketById = createAsyncThunk(
  'tickets/getTicketById',
  async (ticketId, { dispatch, rejectWithValue }) => {
    try {
      if (!ticketId) {
        console.error('No ticket ID provided to getTicketById');
        return rejectWithValue('No ticket ID provided');
      }

      const cleanTicketId = ticketId.toString().trim();

      if (!/^[0-9a-fA-F]{24}$/.test(cleanTicketId)) {
        console.error(`Invalid ticket ID format: ${cleanTicketId}`);
        return rejectWithValue('Invalid ticket ID format');
      }
      
      dispatch(startLoading());
      const response = await api.get(`/api/tickets/${cleanTicketId}`);
      dispatch(setCurrentTicket(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch ticket';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      console.log('Creating ticket with data:', {
        title: ticketData.title,
        contentLength: ticketData.content?.length || 0,
        attachments: ticketData.attachments?.length || 0
      });
      
      const formData = new FormData();
      formData.append('title', ticketData.title);
      formData.append('content', ticketData.content);
      
      if (ticketData.priority) {
        formData.append('priority', ticketData.priority);
      }
      
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        ticketData.attachments.forEach((file) => {
          formData.append('attachments', file, file.name);
        });
      }
      
      const uploadResult = await uploadFile('/api/tickets', formData);
      
      if (!uploadResult.success) {
        console.error('Ticket creation failed:', uploadResult.message);
        return rejectWithValue(uploadResult.message);
      }
      
      const response = { data: uploadResult.data };
      const responseTicket = response.data.data || {};
      
      if (responseTicket._id) {
        console.log(`Valid ticket ID found: ${responseTicket._id}`);
      } 
      else {
        console.warn('No _id found in ticket data, attempting to extract from response');
        if (response.data._id) {
          responseTicket._id = response.data._id;
        }
      }

      dispatch(addTicket(responseTicket));
      return responseTicket;
    } 
    catch (error) {
      console.error('Ticket creation failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create ticket';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateStatus',
  async ({ ticketId, status }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.patch(`/api/tickets/${ticketId}/status`, { status });
      dispatch(editTicket(response.data.data));
      return response.data.data;
    }
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update ticket status';
      return rejectWithValue(message);
    }
  }
);

export const updateTicketPriority = createAsyncThunk(
  'tickets/updatePriority',
  async ({ ticketId, priority }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.patch(`/api/tickets/${ticketId}/priority`, { priority });
      dispatch(editTicket(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update ticket priority';
      return rejectWithValue(message);
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async (ticketData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const { id, title, content, newAttachments = [], existingAttachments = [] } = ticketData;
      
      console.log('Updating ticket with data:', {
        id,
        title,
        contentLength: content?.length || 0,
        newAttachmentsCount: newAttachments?.length || 0,
        existingAttachmentsCount: existingAttachments?.length || 0
      });
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      if (existingAttachments && existingAttachments.length > 0) {
        formData.append('existingAttachments', JSON.stringify(existingAttachments));
      }
      
      if (newAttachments && newAttachments.length > 0) {
        newAttachments.forEach((file, index) => {
          formData.append('attachments', file, file.name);
        });
      }
      
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
        } else if (key === 'existingAttachments') {
          console.log(`${key}: JSON string of ${JSON.parse(value).length} attachments`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      const response = await api.put(`/api/tickets/${id}`, formData);
      
      const updatedTicket = response.data.data;
      
      if (!updatedTicket || !updatedTicket._id) {
        throw new Error('Invalid ticket data returned from server');
      }
      
      dispatch(editTicket(updatedTicket));
      return updatedTicket;
    } 
    catch (error) {
      console.error('Ticket update failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update ticket';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const deleteTicket = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      await api.delete(`/api/tickets/${ticketId}`);
      dispatch(removeTicket(ticketId));
      return ticketId;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to delete ticket';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const addReplyToTicket = createAsyncThunk(
  'tickets/addReply',
  async ({ ticketId, content, attachments = [], formData = null }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      
      if (formData instanceof FormData) {
        const uploadResult = await uploadFile(`/api/tickets/${ticketId}/replies`, formData);
        
        if (!uploadResult.success) {
          toast.error(`Reply upload failed: ${uploadResult.message}`);
          return rejectWithValue(uploadResult.message);
        }
        
        dispatch(addReply({ ticketId, reply: uploadResult.data.data }));
        return uploadResult.data.data;
      }
      
      else if (attachments && attachments.length > 0) {
        const newFormData = new FormData();
        newFormData.append('content', content);
        
        console.log(`Adding ${attachments.length} attachments to ticket reply:`, 
          attachments.map(f => ({ name: f.name, type: f.type, size: f.size })));
        
        attachments.forEach((file, index) => {
          newFormData.append('attachments', file, file.name);
        });
        
        const uploadResult = await uploadFile(`/api/tickets/${ticketId}/replies`, newFormData);
        
        if (!uploadResult.success) {
          console.error('Reply upload failed:', uploadResult.message);
          return rejectWithValue(uploadResult.message);
        }
        
        dispatch(addReply({ ticketId, reply: uploadResult.data.data }));
        return uploadResult.data.data;
      } 
      else {
        const response = await api.post(`/api/tickets/${ticketId}/replies`, { content });
        dispatch(addReply({ ticketId, reply: response.data.data }));
        return response.data.data;
      }
    } 
    catch (error) {
      console.error('Reply creation failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add reply';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const assignTicketToAdmin = createAsyncThunk(
  'tickets/assignTicket',
  async ({ ticketId, adminId }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.patch(`/api/tickets/${ticketId}/assign`, { adminId });
      
      dispatch(setAssignedAdmin({ ticketId, adminId }));
      
      if (response.data.data) {
        dispatch(setCurrentTicket(response.data.data));
      }
      
      return response.data.data;
    } 
    catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to assign ticket';
      return rejectWithValue(message);
    }
  }
);

export const getParticipantTickets = createAsyncThunk(
  'tickets/getParticipantTickets',
  async (status, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      console.log('Fetching participant tickets...');
      const response = await api.get(`/api/tickets/participants/me${status ? `?status=${status}` : ''}`);
      console.log('Participant tickets response:', response.data);
      dispatch(setUserTickets(response.data.data));
      return response.data.data;
    } 
    catch (error) {
      console.error('Participant tickets fetch error:', error);
      console.error('Error response:', error.response);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch participant tickets';
      dispatch(setError(message));
      dispatch(setUserTickets([]));
      return rejectWithValue(message);
    }
  }
);
