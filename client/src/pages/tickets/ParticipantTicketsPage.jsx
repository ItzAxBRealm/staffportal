import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { FaArrowLeft, FaSearch, FaFilter, FaSpinner, FaExclamationCircle, FaUser, FaClock, FaUserCheck, FaMapMarkerAlt, FaUserTimes, FaUsers } from 'react-icons/fa';
import { MdPriorityHigh } from 'react-icons/md';
import { getParticipantTickets } from '../../stores/thunks/ticketThunks';
import { selectIsSystemAdmin } from '../../stores/slices/authSlice';

const ParticipantTicketsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth?.user);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const { userTickets, loading, error } = useSelector(state => state.tickets);
  const [filteredTickets, setFilteredTickets] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  
  useEffect(() => {
    dispatch(getParticipantTickets());
  }, [dispatch]);
  
  const ticketsToDisplay = userTickets;
  
  useEffect(() => {
    if (!ticketsToDisplay || !ticketsToDisplay.length) {
      setFilteredTickets([]);
      return;
    }
    
    let results = [...ticketsToDisplay];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) || 
        ticket.content.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter !== 'all') {
      results = results.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      results = results.filter(ticket => 
        (ticket.priority || 'Standard') === priorityFilter
      );
    }
    
    setFilteredTickets(results);
  }, [searchTerm, statusFilter, priorityFilter, ticketsToDisplay]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setShowFilterMenu(false);
  };
  
  const handlePriorityChange = (priority) => {
    setPriorityFilter(priority);
    setShowPriorityMenu(false);
  };
  
  const isAdminView = user?.isAdmin && window.location.pathname.includes('/admin');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-6 py-8 max-w-7xl"
    >
      <div className="flex items-center justify-between mb-8 flex-wrap gap-6">
        <div>
          <button
            onClick={() => navigate('/tickets')}
            className="mb-4 flex items-center py-2 px-3 rounded-lg bg-black hover:bg-[#282828] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] cursor-pointer"
          >
            <FaArrowLeft className="mr-2 bg-white text-black dark:bg-black dark:text-white p-1 rounded-full" /> Back to All Tickets
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Participant Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tickets where you are added as a participant
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <FaUsers className="text-2xl" />
          <span className="text-lg font-medium">
            {filteredTickets.length} {filteredTickets.length === 1 ? 'Ticket' : 'Tickets'}
          </span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-grow max-w-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Tickets
            </label>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or content..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Filter
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFilterMenu(!showFilterMenu);
                    setShowPriorityMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-w-[140px] transition-colors duration-200"
                >
                  <FaFilter className="text-gray-500" />
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    {statusFilter === 'all'
                      ? 'All Status'
                      : statusFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </button>
                
                {showFilterMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                  >
                    <div
                      onClick={() => handleFilterChange('all')}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      All Tickets
                    </div>
                    <div
                      onClick={() => handleFilterChange('open')}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      Open
                    </div>
                    <div
                      onClick={() => handleFilterChange('in-progress')}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      In Progress
                    </div>
                    <div
                      onClick={() => handleFilterChange('resolved')}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      Resolved
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority Filter
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPriorityMenu(!showPriorityMenu);
                    setShowFilterMenu(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 min-w-[140px] transition-colors duration-200"
                >
                  <MdPriorityHigh className="text-gray-500" />
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    {priorityFilter === 'all' 
                      ? 'All Priority' 
                      : priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                  </span>
                </button>
                
                {showPriorityMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                  >
                    <div
                      onClick={() => handlePriorityChange('all')}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      All Priorities
                    </div>
                    <div
                      onClick={() => handlePriorityChange('High Priority')}
                      className="px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center text-gray-700 dark:text-gray-200">
                        <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        High Priority
                      </span>
                    </div>
                    <div
                      onClick={() => handlePriorityChange('Standard')}
                      className="px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center text-gray-700 dark:text-gray-200">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                        Standard
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FaSpinner className="animate-spin h-10 w-10 text-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading participant tickets...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg text-center">
          <FaExclamationCircle className="text-red-500 h-10 w-10 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={() => dispatch(getParticipantTickets())}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <motion.div
              key={ticket._id || ticket.id}
              onClick={() => {
                const ticketId = ticket._id || ticket.id;
                navigate(isAdminView ? `/admin/tickets/${ticketId}` : `/tickets/${ticketId}`);
              }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Participant Badge */}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          <FaUsers className="w-3 h-3 mr-1" />
                          Participant
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.status === 'open'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : ticket.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : ticket.status === 'resolved'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {ticket.status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                        </span>
                        
                        {ticket.priority && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.priority === 'High Priority'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {ticket.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {ticket.content}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaUser className="w-3 h-3" />
                        <span>Created by {ticket.createdBy?.fullName || ticket.createdBy?.username || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {ticket.location && (
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt className="w-3 h-3" />
                          <span className="capitalize">
                            {ticket.location === 'other' && ticket.customLocation 
                              ? ticket.customLocation 
                              : ticket.location}
                          </span>
                        </div>
                      )}
                      
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1">
                          <FaUserCheck className="w-3 h-3" />
                          <span>Assigned to {ticket.assignedTo.fullName || ticket.assignedTo.username}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-700/50 p-6 rounded-lg text-center">
          <FaUsers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Participant Tickets Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You haven't been added as a participant to any tickets yet.
          </p>
          {statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm ? (
            <button 
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSearchTerm('');
              }}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              to="/tickets"
              className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              View All Tickets
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ParticipantTicketsPage;
