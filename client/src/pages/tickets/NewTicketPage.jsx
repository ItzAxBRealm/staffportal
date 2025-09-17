import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { FaArrowLeft } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import NewTicketForm from '../../components/tickets/NewTicketForm.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.jsx';
import { getTicketById } from '../../stores/thunks/ticketThunks';
import api from '../../api/axios';
import { toast } from 'sonner';

const NewTicketPage = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { ticketId } = useParams();
  const { isDark } = useDarkMode();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (mode === 'edit' && ticketId) {
      const fetchTicket = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/tickets/${ticketId}`);
          const ticketData = response.data.data || response.data;
          setTicket(ticketData);
        } catch (err) {
          console.error('Error fetching ticket for editing:', err);
          setError('Could not load ticket details. Please try again.');
          toast.error('Failed to load ticket details');
        } finally {
          setLoading(false);
        }
      };
      
      fetchTicket();
    }
  }, [mode, ticketId]);
  
  const handleSuccess = (ticket) => {
    if (mode === 'edit') {
      toast.success('Ticket updated successfully!');
    } else {
      toast.success('Ticket created successfully!');
    }
    
    const ticketId = ticket._id || (ticket.data && ticket.data._id);
    
    if (!ticketId) {
      console.error('Could not find ticket ID in response:', ticket);
      navigate('/tickets');
      return;
    }
    
    navigate(`/tickets/${ticketId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#947BD3]"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="mb-6">{error}</p>
        <button
          onClick={() => navigate('/tickets')}
          className="px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors"
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-6 max-w-3xl"
    >
      <button
        onClick={() => navigate('/tickets')}
        className="mb-4 flex items-center py-2 px-3 rounded-lg bg-black hover:bg-[#282828] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] cursor-pointer"
      >
        <FaArrowLeft className="mr-2 bg-white text-black dark:bg-black dark:text-white p-1 rounded-full" /> Back to Tickets
      </button>
      
      <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {mode === 'edit' ? 'Edit Support Ticket' : 'Create New Support Ticket'}
      </h1>
      
      <NewTicketForm 
        onSuccess={handleSuccess}
        initialData={mode === 'edit' ? ticket : null} 
        mode={mode}
      />
      
      {mode === 'create' && (
        <div className={`mt-8 p-4 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          <h3 className="font-medium mb-2">Tips for Faster Support:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Be specific about the issue you're experiencing</li>
            <li>Include steps to reproduce the problem</li>
            <li>Add screenshots or files if they help explain the issue</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default NewTicketPage;
