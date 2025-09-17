import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getAllTickets } from '../../stores/thunks/ticketThunks';
import { selectIsSystemAdmin } from '../../stores/slices/authSlice';
import { BiSearch } from 'react-icons/bi';
import { MdPriorityHigh, MdOutlineLowPriority } from 'react-icons/md';
import { FaFilter, FaSpinner, FaExclamationCircle, FaUserCheck, FaUserTimes } from 'react-icons/fa';
import { BsCheckCircleFill, BsXCircleFill, BsHourglassSplit, BsQuestionCircle } from 'react-icons/bs';
import { format } from 'date-fns';
import Spinner from '../../components/ui/Spinner';
import { motion, AnimatePresence } from 'motion/react';
import NoDataMessage from '../../components/ui/NoDataMessage';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';

const AllTicketsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allTickets: tickets, loading, error } = useSelector((state) => state.tickets);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [filteredTickets, setFilteredTickets] = useState([]);

  useEffect(() => {
    dispatch(getAllTickets());
  }, [dispatch]);

  useEffect(() => {
    if (tickets && Array.isArray(tickets)) {
      let filtered = [...tickets];
      
      if (searchTerm) {
        filtered = filtered.filter(ticket => 
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          ticket.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (priorityFilter) {
        filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
      }
      
      if (statusFilter) {
        filtered = filtered.filter(ticket => ticket.status === statusFilter);
      }
      
      setFilteredTickets(filtered);
    }
  }, [tickets, searchTerm, priorityFilter, statusFilter]);

  const handleReset = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setStatusFilter('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 dark:bg-red-900/10 rounded-lg max-w-xl mx-auto mt-10">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-3">Error Loading Tickets</h2>
        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={() => dispatch(getAllTickets())}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">All Tickets</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage and monitor all support tickets</p>
          </div>
          <Link to="/admin/tickets/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <span>New Ticket</span>
          </Link>
        </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search tickets..."
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

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>
      </div>

        {/* Ticket list */}
        {filteredTickets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assigned To
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredTickets.map((ticket) => (
                <motion.tr
                  key={ticket._id || ticket.id}
                  onClick={() => {
                    const ticketId = ticket._id || ticket.id;
                    console.log('Navigating to ticket:', ticketId);
                    navigate(`/admin/tickets/${ticketId}`);
                  }}
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {ticket.content}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {ticket.createdBy?.fullName || ticket.createdBy?.username || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(ticket.createdAt), 'PPP p')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TicketStatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {ticket.priority || 'Standard'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {ticket.assignedTo?.fullName || 'Unassigned'}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-700/50 p-6 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">No tickets found matching your filters.</p>
          {statusFilter || priorityFilter || searchTerm ? (
            <button 
              onClick={handleReset}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      )}
    </div>
    </div>
  );
};

export default AllTicketsPage;
