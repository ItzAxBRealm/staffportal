import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { FaPaperPlane, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import FileUpload from '../common/FileUpload';
import { createTicket, updateTicket } from '../../stores/thunks/ticketThunks';
import api from '../../api/axios';

const NewTicketForm = ({ onSuccess, initialData = null, mode = 'create' }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.tickets);
  const user = useSelector(state => state.auth?.user);
  const isAdmin = user?.isAdmin || false;
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.content || '');
  const [priority, setPriority] = useState(initialData?.priority || 'Standard');
  const [attachments, setAttachments] = useState([]);
  const [submitError, setSubmitError] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const isEditMode = mode === 'edit';
  
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.content || '');
      setPriority(initialData.priority || 'Standard');

      if (initialData.attachments && initialData.attachments.length > 0) {
        setExistingAttachments(initialData.attachments);
      }
    }
  }, [initialData]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!title.trim()) {
      setSubmitError('Please enter a title for your ticket');
      return;
    }
    
    if (!description.trim()) {
      setSubmitError('Please enter a description for your ticket');
      return;
    }
    
    try {
      const ticketData = {
        title: title.trim(),
        content: description.trim(),
        attachments: attachments,
        priority: priority
      };
      
      let resultAction;
      
      if (isEditMode && initialData) {
        const ticketId = initialData.id || initialData._id;
        
        const updateData = {
          id: ticketId,
          title: ticketData.title,
          content: ticketData.content,
          priority: ticketData.priority,
          newAttachments: ticketData.attachments,
          existingAttachments: existingAttachments
        };
        
        resultAction = await dispatch(updateTicket(updateData));
      } else {
        resultAction = await dispatch(createTicket(ticketData));
      }
      
      if (resultAction.meta && resultAction.meta.requestStatus === 'fulfilled') {
        if (!isEditMode) {
          setTitle('');
          setDescription('');
          setPriority('Standard');
          setAttachments([]);
          setSubmitError(null);
        }
        if (onSuccess) onSuccess(resultAction.payload);
      } 
      else {
        const errorMessage = resultAction.payload || `Failed to ${isEditMode ? 'update' : 'create'} ticket`;
        setSubmitError(errorMessage);
      }
    } 
    catch (error) {
      setSubmitError(`Failed to ${isEditMode ? 'update' : 'create'} ticket. Please try again.`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {isEditMode ? 'Edit Ticket' : 'Submit a New Ticket'}
      </h2>
      
      {(submitError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center p-3 mb-4 text-sm font-medium text-red-800 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-200"
        >
          <FaExclamationCircle className="flex-shrink-0 mr-2" />
          {submitError || error}
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your issue"
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#947BD3] dark:focus:ring-[#a9a1be] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about your issue"
            rows={5}
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#947BD3] dark:focus:ring-[#a9a1be] focus:border-transparent resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading}
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </div>
        
        {isAdmin && (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#947BD3] dark:focus:ring-[#a9a1be] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            >
              <option value="Standard">Standard Priority</option>
              <option value="High Priority">High Priority</option>
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Attachments (Optional)
          </label>
          <FileUpload 
            files={attachments}
            setFiles={setAttachments}
            maxFiles={3}
            allowedTypes={['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
            maxSizeMB={5}
            disabled={loading}
            className="mb-4"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Only image files are supported. Maximum 5 files.
          </p>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading ? 'bg-[#947BD3]' : 'bg-[#947BD3] hover:bg-[#7964ad]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#947BD3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2" />
                {isEditMode ? 'Updating ticket...' : 'Creating ticket...'}
              </>
            ) : (
              <>
                <FaPaperPlane className="-ml-1 mr-2" />
                {isEditMode ? 'Update Ticket' : 'Submit Ticket'}
              </>
            )}
          </button>
          
          {!isEditMode && (
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              You'll receive email notifications when your ticket is updated
            </p>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default NewTicketForm;
