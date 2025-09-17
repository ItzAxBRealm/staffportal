import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FaPaperPlane, FaPaperclip, FaSpinner, FaTimes, 
  FaExclamationCircle, FaArrowDown } from 'react-icons/fa';
import MessageBubble from './MessageBubble';
import { useSocket } from '../../hooks/useSocket';
import { addMessage } from '../../stores/slices/messagesSlice';

const MessageThread = ({ 
  messages = [], 
  ticketId, 
  onSendReply, 
  currentUserId, 
  loading = false,
  error = null 
}) => {
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { socket, isConnected } = useSocket();
  
  const supportedTypes = useMemo(() => [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ], []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;
    setIsSubmitting(true);
    setSubmissionError(null);
    const formData = new FormData();
    formData.append('content', newMessage.trim());
    attachments.forEach(file => formData.append('attachments', file));
    
    try {
      await onSendReply(ticketId, formData);
      setNewMessage('');
      setAttachments([]);
      setAttachmentPreviews([]);
      setTimeout(() => scrollToBottom('smooth'), 100);
    } 
    catch (error) {
      console.error('Reply submission failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send reply. Please try again.';
      setSubmissionError(errorMessage);
      setTimeout(() => setSubmissionError(null), 5000);
    } 
    finally {
      setIsSubmitting(false);
    }
  };
  
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const bottom = scrollHeight - scrollTop - clientHeight < 100;
    const showButton = scrollHeight - scrollTop - clientHeight > 200;
    setIsAtBottom(bottom);
    setShowScrollButton(showButton);
  }, []);

  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  }, [messages.length, isAtBottom, scrollToBottom]);

  useEffect(() => {
    if (!socket || !ticketId) return;

    const handleNewMessage = (message) => {
      if (message.ticketId === ticketId) {
        dispatch(addMessage(message));
        if (isAtBottom) {
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      }
    };

    const handleMessageUpdate = (updatedMessage) => {
      if (updatedMessage.ticketId === ticketId) {
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdate);
    socket.emit('join_ticket', ticketId);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdate);
      socket.emit('leave_ticket', ticketId);
    };
  }, [socket, ticketId, isAtBottom, currentUserId, dispatch, scrollToBottom]);

  useEffect(() => {
    return () => {
      attachmentPreviews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [attachmentPreviews]);
  
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const validFiles = [];
    const errors = [];
    
    files.forEach(file => {
      const isTypeSupported = supportedTypes.includes(file.type);
      const isSizeValid = file.size <= 10 * 1024 * 1024;
      
      if (!isTypeSupported) {
        errors.push(`${file.name}: File type not supported`);
      } 
      else if (!isSizeValid) {
        errors.push(`${file.name}: File too large (max 10MB)`);
      } 
      else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      console.warn('File validation errors:', errors);
    }
    
    if (validFiles.length === 0) return;
    const remainingSlots = 5 - attachments.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    setAttachments(prev => [...prev, ...filesToAdd]);
    
    const newPreviews = filesToAdd.map(file => ({
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      type: file.type,
      size: file.size
    }));
    
    setAttachmentPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  }, [attachments.length, supportedTypes]);

const removeAttachment = useCallback((index) => {
  const newAttachments = [...attachments];
  const newPreviews = [...attachmentPreviews];

  if (attachmentPreviews[index]?.url) {
    URL.revokeObjectURL(attachmentPreviews[index].url);
  }
  
  newAttachments.splice(index, 1);
  newPreviews.splice(index, 1);
  setAttachments(newAttachments);
  setAttachmentPreviews(newPreviews);
}, [attachments, attachmentPreviews]);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (newMessage.trim() || attachments.length > 0) {
      handleSubmit(e);
    }
  }
};

return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col h-full max-w-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm"
  >
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative"
      onScroll={handleScroll}
    >
      {loading ? (
        <div className="flex justify-center items-center h-full py-8">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading messages...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
            <FaPaperPlane className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No messages yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Need assistance? Send us a message to begin your support request.
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <div key={message._id || index} className="mb-4 sm:mb-6">
              <MessageBubble
                message={message} 
                isCurrentUser={message.sender?._id === currentUserId}
                username={message.sender?.name || 'Unknown'}
                timestamp={message.createdAt}
              />
            </div>
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </AnimatePresence>
      )}
      
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom('smooth')}
            className="fixed bottom-24 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg z-10 transition-colors"
            aria-label="Scroll to bottom"
          >
            <FaArrowDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium"
        >
          <FaExclamationCircle className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
    
    <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4 bg-white dark:bg-gray-800 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <AnimatePresence>
          {submissionError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium"
            >
              <FaExclamationCircle className="mr-2 flex-shrink-0" />
              <span>{submissionError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {attachmentPreviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 sm:gap-3 mb-3 max-h-24 sm:max-h-32 overflow-y-auto p-1 sm:p-2 border-b border-gray-200 dark:border-gray-700"
            >
              {attachmentPreviews.map((preview, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group cursor-pointer flex-shrink-0"
                >
                  {preview.url ? (
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-md border-2 border-gray-200 dark:border-gray-600 transition-all group-hover:border-blue-500"
                    />
                  ) : (
                    <div className="h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-md border-2 border-gray-200 dark:border-gray-600">
                      <FaPaperclip className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="truncate">{preview.name}</div>
                    <div>{formatFileSize(preview.size)}</div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute z-10 bottom-20 sm:bottom-24 right-2 sm:right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 sm:p-3 shadow-lg transition-all transform hover:scale-105 flex items-center"
                    disabled={isSubmitting}
                    title="Remove attachment"
                  >
                    <FaTimes className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full min-h-[80px] sm:min-h-[100px] border border-gray-300 dark:border-gray-600 rounded-xl p-3 sm:p-4 pr-12 sm:pr-14 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-y transition-all duration-200 text-sm sm:text-base"
            rows={3}
            disabled={isSubmitting}
            onKeyDown={handleKeyDown}
            style={{ whiteSpace: 'pre-wrap' }}
          />
            
            <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 p-1 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                disabled={isSubmitting || attachments.length >= 5}
                title={attachments.length >= 5 ? "Maximum 5 attachments" : "Attach files"}
              >
                <FaPaperclip className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || (!newMessage.trim() && attachments.length === 0)}
                className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full transition-all ${
                  isSubmitting || (!newMessage.trim() && attachments.length === 0)
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                }`}
                title={isSubmitting ? "Sending..." : "Send message"}
              >
                {isSubmitting ? (
                  <FaSpinner className="h-4 w-4 animate-spin" />
                ) : (
                  <FaPaperPlane className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </form>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </motion.div>
  );
};

export default MessageThread;