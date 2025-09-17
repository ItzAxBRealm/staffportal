import React from 'react';
import { motion } from 'motion/react';
import { FaClock, FaTag, FaUserCircle, FaCommentAlt, FaPaperclip } from 'react-icons/fa';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import TicketPriorityBadge from './TicketPriorityBadge';

const TicketCard = ({ 
  ticket = {}, 
  showDetails = false,
}) => {
  const { 
    _id, 
    ticketId,
    title, 
    content, 
    status = 'open', 
    priority = 'Standard', 
    createdAt, 
    assignedTo, 
    messageCount = 0,
    hasAttachments = false,
    unread = false,
    createdBy = {}
  } = ticket;
  
  const formattedDate = createdAt ? format(new Date(createdAt), 'MMM dd, yyyy') : 'No date';
  const timeAgo = createdAt ? format(new Date(createdAt), 'h:mm a') : '';
  
  const statusStyles = {
    open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { 
      scale: 1.02,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    tap: { scale: 0.98 }
  };

  return (
    <Link to={`/tickets/${_id}`} className="block no-underline">
      <motion.div
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        variants={cardVariants}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`bg-white dark:bg-[#222831] rounded-lg shadow-md overflow-hidden mb-4 border-l-4 w-full ${
          priority === 'High Priority' ? 'border-red-500 dark:border-red-700' : 'border-blue-500 dark:border-blue-700'
        } ${unread ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}`}
      >
        <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-3">
            <div className="w-full sm:w-auto">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white flex items-center break-words">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400 mr-2">#{ticketId}</span>
                {title}
                {unread && (
                  <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block" title="Unread messages"></span>
                )}
              </h3>
              {showDetails && (
                <p className="mt-1 text-gray-600 dark:text-gray-300 line-clamp-2">
                  {content}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start sm:items-end space-y-2 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="flex space-x-2">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${statusStyles[status] || statusStyles.open}`}>
                  {status?.replace(/-/g, ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
                <TicketPriorityBadge priority={priority} />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created by: {createdBy?.fullName || createdBy?.name || 'Unknown User'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-between items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4">
            <div className="flex items-center">
              <FaClock className="mr-1" />
              <span title={timeAgo}>{formattedDate}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 sm:space-x-4 mt-2 sm:mt-0">
              {messageCount > 0 && (
                <div className="flex items-center" title={`${messageCount} message${messageCount === 1 ? '' : 's'}`}>
                  <FaCommentAlt className="mr-1" />
                  <span>{messageCount}</span>
                </div>
              )}
              
              {hasAttachments && (
                <div className="flex items-center" title="Has attachments">
                  <FaPaperclip className="mr-1" />
                </div>
              )}
              
              {assignedTo && (
                <div className="flex items-center" title={`Assigned to ${typeof assignedTo === 'object' ? assignedTo.fullName || 'Admin' : assignedTo}`}>
                  <FaUserCircle className="mr-1" />
                  <span className="truncate max-w-[100px]">
                    {typeof assignedTo === 'object' ? assignedTo.fullName || 'Admin' : assignedTo}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default TicketCard;
