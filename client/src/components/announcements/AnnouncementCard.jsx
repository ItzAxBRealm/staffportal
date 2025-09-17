import React from 'react';
import { motion } from 'motion/react';
import { FaCalendarAlt, FaUserCircle } from 'react-icons/fa';
import { format } from 'date-fns';

const AnnouncementCard = ({ announcement = {}, onClick = () => {}, expanded = false }) => {
  const { title, content, createdAt, createdBy, priority = 'normal', _id } = announcement;
  
  const formattedDate = createdAt ? format(new Date(createdAt), 'MMM dd, yyyy \'at\' hh:mm a') : 'No date';
  
  const priorityStyles = {
    high: 'border-l-red-500',
    normal: 'border-l-blue-500',
    low: 'border-l-green-500'
  };
  const priorityBadgeStyles = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    normal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-white dark:bg-[#222831] rounded-lg shadow-md overflow-hidden mb-4 border-l-4 ${priorityStyles[priority] || priorityStyles.normal} hover:shadow-lg transition-all duration-300 cursor-pointer`}
      onClick={() => onClick(_id)}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
          {priority && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${priorityBadgeStyles[priority] || priorityBadgeStyles.normal}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          )}
        </div>
        
        <div className="mb-4 text-gray-600 dark:text-gray-300">
          {expanded ? content : `${content?.substring(0, 150)}${content?.length > 150 ? '...' : ''}`}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-1" />
            <span>{formattedDate}</span>
          </div>
          
          {createdBy && (
            <div className="flex items-center">
              <FaUserCircle className="mr-1" />
              <span>{typeof createdBy === 'object' ? createdBy.fullName : createdBy}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AnnouncementCard;
