import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllTickets, getUserTickets } from '../../stores/thunks/ticketThunks';
import { Link } from 'react-router-dom';
import { BiSearch } from 'react-icons/bi';
import { MdPriorityHigh, MdOutlineLowPriority } from 'react-icons/md';
import { FaFilter, FaMapMarkerAlt } from 'react-icons/fa';
import { BsCheckCircleFill, BsXCircleFill, BsHourglassSplit, BsQuestionCircle } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import Spinner from '../../components/ui/Spinner';
import { motion, AnimatePresence } from 'motion/react';
import NoDataMessage from '../../components/ui/NoDataMessage';

const AssignedTicketsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userTickets: tickets, loading, error } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [filteredTickets, setFilteredTickets] = useState([]);

  useEffect(() => {
    dispatch(getUserTickets());
  }, [dispatch]);

  useEffect(() => {
    if (tickets && Array.isArray(tickets) && user) {
      let assignedTickets = tickets.filter(ticket => {
        const ticketAssignedTo = ticket.assignedTo;
        const userId = user._id || user.id;
        
        if (!ticketAssignedTo) return false;
        
        const assignedId = typeof ticketAssignedTo === 'object' ? 
          ticketAssignedTo._id || ticketAssignedTo.id : 
          ticketAssignedTo;
        return assignedId === userId;
      });
      
      if (searchTerm) {
        assignedTickets = assignedTickets.filter(ticket => 
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          ticket.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (priorityFilter) {
        assignedTickets = assignedTickets.filter(ticket => ticket.priority === priorityFilter);
      }
      
      if (statusFilter) {
        assignedTickets = assignedTickets.filter(ticket => ticket.status === statusFilter);
      }
      
      if (locationFilter) {
        assignedTickets = assignedTickets.filter(ticket => {
          const ticketLocation = ticket.location === 'other' && ticket.customLocation 
            ? ticket.customLocation.toLowerCase() 
            : ticket.location?.toLowerCase();
          return ticketLocation === locationFilter.toLowerCase();
        });
      }
      
      setFilteredTickets(assignedTickets);
    }
  }, [tickets, user, searchTerm, priorityFilter, statusFilter, locationFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <BsQuestionCircle className="text-blue-500" />;
      case 'in-progress':
        return <BsHourglassSplit className="text-yellow-500" />;
      case 'resolved':
        return <BsCheckCircleFill className="text-green-500" />;
      case 'closed':
        return <BsXCircleFill className="text-gray-500" />;
      default:
        return <BsQuestionCircle className="text-blue-500" />;
    }
  };

  const getPriorityIcon = (priority) => {
    return priority === 'High Priority' ? 
      <MdPriorityHigh className="text-red-500" /> : 
      <MdOutlineLowPriority className="text-blue-500" />;
  };

  const handleReset = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setStatusFilter('');
    setLocationFilter('');
  };

  if (loading) {
    return <div className="h-full flex justify-center items-center"><Spinner size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="h-full flex flex-col justify-center items-center">
        <p className="text-red-500">Error loading tickets: {error}</p>
        <button 
          onClick={() => dispatch(getAllTickets())}
          className="mt-4 px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 dark:text-gray-100">Tickets Assigned to You</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage support tickets that have been assigned to you</p>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search your tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
            />
            <BiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md border border-gray-300 appearance-none dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md border border-gray-300 appearance-none dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Priorities</option>
                <option value="Standard">Standard</option>
                <option value="High Priority">High Priority</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <MdPriorityHigh className="text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md border border-gray-300 appearance-none dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Locations</option>
                <option value="cathlab">Cathlab</option>
                <option value="consulting suites">Consulting Suites</option>
                <option value="dpu">DPU</option>
                <option value="front office">Front Office</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="internal admin">Internal Admin</option>
                <option value="kitchen">Kitchen</option>
                <option value="maintenance">Maintenance</option>
                <option value="oncology">Oncology</option>
                <option value="pet">PET</option>
                <option value="pre-admissions">Pre-Admissions</option>
                <option value="supply">Supply</option>
                <option value="theatre">Theatre</option>
                <option value="ward">Ward</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredTickets.length} tickets assigned to you
        </div>
      </div>

      <AnimatePresence>
        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredTickets.map((ticket) => (
                  <motion.tr
                    key={ticket._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {ticket.content}
                      </div>
                      {ticket.messages && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {ticket.messages.length} {ticket.messages.length === 1 ? 'Reply' : 'Replies'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {ticket.createdBy?.fullName || 'Anonymous'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {ticket.location === 'other' && ticket.customLocation 
                            ? ticket.customLocation 
                            : ticket.location || 'Not specified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(ticket.status)}
                        <span className="capitalize text-sm text-black dark:text-gray-400">
                          {ticket.status.replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(ticket.priority || 'Standard')}
                        <span className="text-sm text-black dark:text-gray-400">
                          {ticket.priority || 'Standard'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <NoDataMessage 
            title="No assigned tickets found" 
            description="You don't have any tickets assigned to you that match the current filters" 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignedTicketsPage;
