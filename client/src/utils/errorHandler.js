import { toast } from 'sonner';

// Common error status codes and messages
const ERROR_MESSAGES = {
  400: 'Bad request: Please check your input and try again.',
  401: 'Unauthorized: Please log in again.',
  403: 'Forbidden: You do not have permission to perform this action.',
  404: 'Not found: The requested resource could not be found.',
  409: 'Conflict: This action conflicts with the current state.',
  422: 'Validation error: Please check your input and try again.',
  500: 'Server error: Something went wrong on our end.',
  503: 'Service unavailable: The server is currently unavailable.',
  default: 'Something went wrong. Please try again later.'
};

export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    logToConsole = true,
    defaultMessage = ERROR_MESSAGES.default
  } = options;

  const status = error.response?.status;
  const message = 
    error.response?.data?.message || 
    ERROR_MESSAGES[status] || 
    error.message || 
    defaultMessage;

  if (logToConsole) {
    console.error('API Error:', {
      status,
      message,
      error
    });
  }

  if (showToast) {
    toast.error(message);
  }

  return {
    status,
    message,
    original: error,
    isApiError: true
  };
};

export const formatErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.isApiError) return error.message;
  
  if (error.response?.data?.message) return error.response.data.message;
  
  if (error.message) return error.message;
  
  return 'An unknown error occurred';
};

export const withErrorHandling = (fn, options = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } 
    catch (error) {
      return handleApiError(error, options);
    }
  };
};

export default {
  handleApiError,
  formatErrorMessage,
  withErrorHandling
};
