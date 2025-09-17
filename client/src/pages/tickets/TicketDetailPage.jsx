import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import { FaArrowLeft, FaSpinner, FaExclamationCircle, FaEdit, FaTrash, FaReply } from 'react-icons/fa';
import { toast } from 'sonner';
import { getTicketById, updateTicketStatus, updateTicketPriority, assignTicketToAdmin, deleteTicket, addReplyToTicket } from '../../stores/thunks/ticketThunks';
import { setCurrentTicket } from '../../stores/slices/ticketSlice';
import config from '../../config';
import { formatDate } from '../../utils/formatters';
import MessageThread from '../../components/tickets/MessageThread';
import AdminAssignDropdown from '../../components/tickets/AdminAssignDropdown';
import ParticipantDropdown from '../../components/tickets/ParticipantDropdown';

const TicketDetailPage = ({ adminView = false }) => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth?.user);
  const { currentTicket, loading, error } = useSelector(state => state.tickets);
  
  const [submittingReply, setSubmittingReply] = useState(false);
  const [ticketParticipants, setTicketParticipants] = useState([]);

  useEffect(() => {
    dispatch(getTicketById(ticketId));
  }, [dispatch, ticketId]);

  useEffect(() => {
    if (currentTicket?.participants) {
      setTicketParticipants(currentTicket.participants);
    }
  }, [currentTicket]);

  useEffect(() => {
    if (!adminView && user?.isAdmin === true) {
      navigate(`/admin/tickets/${ticketId}`, { replace: true });
    }
  }, [adminView, user?.isAdmin, ticketId, navigate]);
  

  const isAdmin = user?.isAdmin || false;
  const hasAdminPermissions = user?.isAdmin === true || user?.role === 'admin';
  
  const isOwner = user?._id === currentTicket?.createdBy?._id;
  
  const canManageTicket = adminView ? hasAdminPermissions : isOwner;
  
  const canAssignTickets = adminView && isAdmin;
  
  const handleStatusChange = async (newStatus) => {
    try {
      const result = await dispatch(updateTicketStatus({ ticketId, status: newStatus }));
      if (result.payload) {
        dispatch(setCurrentTicket(result.payload));
        await dispatch(getTicketById(ticketId));
        toast.success(`Ticket status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const result = await dispatch(updateTicketPriority({ ticketId, priority: newPriority }));
      if (result.payload) {
        dispatch(setCurrentTicket(result.payload));
        await dispatch(getTicketById(ticketId));
        toast.success(`Ticket priority updated to ${newPriority}`);
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update ticket priority');
    }
  };
  
  const handleEdit = () => {
    navigate(`/tickets/edit/${ticketId}`);
  };
  const handleDelete = async () => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Ticket</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this ticket? This action cannot be undone.</p>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    performDeleteTicket();
                  }}
                  className="px-3 py-1 bg-red-600 rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
  };
  
  const performDeleteTicket = async () => {
    try {
      if (!ticketId) {
        console.error('Cannot delete: ticketId is undefined');
        toast.error('Failed to delete ticket: Invalid ticket ID');
        return;
      }
      
      try {
        await dispatch(deleteTicket(ticketId)).unwrap();
        toast.success('Ticket deleted successfully');
      } catch (err) {
        console.error('Error response from delete operation:', err);
        const errorString = JSON.stringify(err).toLowerCase();
        
        if (errorString.includes('ticket is not defined') || 
            err?.message === 'ticket is not defined' || 
            err?.response?.data?.message === 'ticket is not defined') {
          toast.success('Ticket deleted successfully');
        } else {
          const errorMessage = err?.response?.data?.message || err.message || 'Unknown error';
          toast.error('Failed to delete ticket: ' + errorMessage);
          return;
        }
      }
      
      navigate('/tickets');
    } catch (outer) {
      console.error('Unexpected error in performDeleteTicket:', outer);
      toast.error('An unexpected error occurred');
    }
  };
  
  const handleReplySubmit = async (ticketId, formData) => {
    setSubmittingReply(true);
    try {
      const hasAttachments = formData.get('attachments');
      
      for (let [key, value] of formData.entries()) {
        if (key === 'attachments' && value instanceof File) {
          console.log(`Attachment: ${value.name}, Size: ${value.size}, Type: ${value.type}`);
          break;
        }
      }
      
      if (!formData.get('content') && hasAttachments) {
        formData.set('content', '');
      }
      
      await dispatch(addReplyToTicket({ ticketId, formData }));
      await dispatch(getTicketById(ticketId));
      toast.success('Reply sent successfully');
      return true; 
    } catch (error) {
      console.error('Failed to submit reply:', error);
      toast.error('Failed to send reply. Please try again.');
      return false; 
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleParticipantAdded = async (updatedTicket) => {
    dispatch(setCurrentTicket(updatedTicket));
    await dispatch(getTicketById(ticketId));
  };

  const handleParticipantRemoved = async (removedUserId) => {
    if (currentTicket) {
      const updatedParticipants = currentTicket.participants.filter(
        participant => participant._id !== removedUserId
      );
      const updatedTicket = {
        ...currentTicket,
        participants: updatedParticipants
      };
      dispatch(setCurrentTicket(updatedTicket));
      setTicketParticipants(updatedParticipants);
      await dispatch(getTicketById(ticketId));
    }
  };

  const handleBackNavigation = () => {
    if (adminView) {
      navigate(isAdmin && currentTicket?.assignedTo?._id === user?._id ? '/admin/tickets/assigned' : '/admin/tickets');
    } else {
      navigate('/tickets');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-6 px-4 md:px-6"
    >
      <button
        onClick={handleBackNavigation}
        className="mb-4 flex items-center py-2 px-3 rounded-lg bg-black hover:bg-[#282828] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] cursor-pointer"
      >
        <FaArrowLeft className="mr-2 bg-white text-black dark:bg-black dark:text-white p-1 rounded-full" /> Back to {adminView ? (isAdmin && currentTicket?.assignedTo?._id === user?._id ? 'Assigned Tickets' : 'All Tickets') : 'Tickets'}
      </button>
      
      {loading ? (
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <FaSpinner className="animate-spin h-10 w-10 text-black mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading ticket details...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg text-center">
          <FaExclamationCircle className="text-red-500 h-10 w-10 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={() => navigate('/tickets')}
            className="mt-4 bg-black hover:bg-[#3b3b3b] dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] text-white px-4 py-2 rounded"
          >
            Return to Tickets
          </button>
        </div>
      ) : currentTicket ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="p-6">
                <div className=" flex flex-row items-start justify-between space-y-3 mb-6">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {currentTicket?.title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      #{currentTicket?.ticketId}
                    </p>
                  </div>
                  
                  <div className="flex px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded justify-center flex-row items-start gap-6 mb-3">
                    <div className="flex justify-center flex-col items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Created by {currentTicket?.createdBy?.fullName}</span>
                      <span>{formatDate(currentTicket?.createdAt)}</span>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        currentTicket?.priority === 'high' 
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                          : currentTicket?.priority === 'medium'
                          ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                          : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {currentTicket?.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        currentTicket?.status === 'open' 
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : currentTicket?.status === 'in-progress'
                          ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                          : currentTicket?.status === 'resolved'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                      }`}>
                        {currentTicket?.status}
                      </span>
                    </div>
                  </div>
                </div>

                {canManageTicket && (
                  <div className="space-y-4">
                    {adminView && hasAdminPermissions && (
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Admin Controls</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                            <select
                              value={currentTicket.status}
                              onChange={(e) => handleStatusChange(e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#947BD3] focus:border-[#7964AD] cursor-pointer"
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                            <select
                              value={currentTicket.priority || 'Standard'}
                              onChange={(e) => handlePriorityChange(e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#947BD3] focus:border-[#7964AD] cursor-pointer"
                            >
                              <option value="Standard">Standard Priority</option>
                              <option value="High Priority">High Priority</option>
                            </select>
                          </div>
                          {canAssignTickets && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assignment</label>
                              <AdminAssignDropdown 
                                ticketId={currentTicket._id} 
                                currentAssignee={currentTicket.assignedTo} 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {isOwner && currentTicket.status !== 'closed' && currentTicket.status !== 'resolved' && (
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ticket Actions</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={handleEdit}
                            className="flex-1 bg-[#947BD3] hover:bg-[#7964AD] text-white rounded-lg px-4 py-2 text-sm font-medium focus:outline-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <FaEdit className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            className="flex-1 bg-black hover:bg-[#282828] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] rounded-lg px-4 py-2 text-sm font-medium focus:outline-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <FaTrash className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {(hasAdminPermissions || isOwner) && (
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <ParticipantDropdown
                          ticketId={currentTicket._id}
                          participants={ticketParticipants}
                          onParticipantAdded={handleParticipantAdded}
                          onParticipantRemoved={handleParticipantRemoved}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{currentTicket.content}</p>
              </div>
            </div>
            
            {currentTicket.attachments && currentTicket.attachments.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attachments ({currentTicket.attachments.length})</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {currentTicket.attachments.map((attachment, index) => {
                    const originalUrl = typeof attachment === 'string' ? attachment : attachment?.url || '';
                    
                    const filename = typeof attachment === 'string' 
                      ? originalUrl.split('/').pop() 
                      : (attachment?.originalName || attachment?.filename || `attachment-${index + 1}`);
                    
                    const isImage = 
                      (attachment.mimeType && attachment.mimeType.startsWith('image/')) || 
                      /\.(jpe?g|png|gif|webp|bmp)$/i.test(filename);
                    
                    let attachmentUrl = originalUrl;
                    let imageUrl = originalUrl;
                    
                    if (originalUrl && originalUrl.startsWith('/')) {
                      const relativePath = originalUrl.replace(/^\/+/, '');
                      imageUrl = `${config.API_BASE_URL}/${relativePath}`;
                      attachmentUrl = imageUrl;
                    }
                    return (
                      <div key={index} className="group">
                        <a 
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                          title={filename}
                          onClick={(e) => {
                            if (!attachmentUrl) {
                              e.preventDefault();
                              console.error('Invalid attachment URL');
                            }
                          }}
                        >
                          <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center hover:shadow-lg transition-shadow">
                            {isImage ? (
                              <img 
                                src={imageUrl}
                                alt={filename}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  console.error('Error loading image:', imageUrl, e);
                                  const img = e.target;
                                  img.onerror = null;
                                  img.style.display = 'none';
                                  const fallback = img.nextElementSibling;
                                  if (fallback) {
                                    fallback.classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : null}
                            {!isImage || !imageUrl ? (
                              <div className="p-3 text-center">
                                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-300 block">
                                  {filename.split('.').pop()?.toUpperCase() || 'FILE'}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </a>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center truncate" title={filename}>
                          {filename.length > 20 ? `${filename.substring(0, 17)}...` : filename}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600">
            <div className="p-6 bg-gradient-to-r from-zinc-50 to-stone-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 dark:bg-stone-900/30 rounded-lg">
                  <FaReply className="w-5 h-5 text-black dark:text-stone-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discussion Thread</h2>
                {currentTicket?.messages?.length > 0 && (
                  <span className="ml-auto px-3 py-1 bg-stone-100 dark:bg-stone-900/30 text-stone-800 dark:text-stone-200 text-sm font-medium rounded-full">
                    {currentTicket.messages.length} {currentTicket.messages.length === 1 ? 'message' : 'messages'}
                  </span>
                )}
              </div>
            </div>
            <div className="h-[350px] sm:h-[400px] md:h-[500px]">
              <MessageThread 
                messages={currentTicket?.messages || []} 
                currentUserId={user?._id}
                ticketId={ticketId}
                onSendReply={handleReplySubmit}
                isAdmin={isAdmin}
                loading={submittingReply}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded-lg text-center">
          <FaExclamationCircle className="text-yellow-500 h-10 w-10 mx-auto mb-4" />
          <p className="text-yellow-600 dark:text-yellow-400">Ticket not found. It may have been deleted.</p>
          <button 
            onClick={() => navigate('/tickets')}
            className="mb-4 flex items-center py-2 px-3 rounded-lg bg-black hover:bg-[#282828] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] cursor-pointer"
          >
            Return to Tickets
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TicketDetailPage;
