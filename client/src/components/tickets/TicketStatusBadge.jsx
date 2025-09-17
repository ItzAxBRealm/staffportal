import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FaChevronDown, FaSpinner } from 'react-icons/fa';

const statusStyles = {
  open: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700'
  },
  'in-progress': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700'
  },
  resolved: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700'
  }
};

const TicketStatusBadge = ({ status, isAdmin = false, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const styles = statusStyles[status] || statusStyles.open;
  
  const statusOptions = ['open', 'in-progress', 'resolved'].filter(s => s !== status);
  
  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
      setIsOpen(false);
    } 
    catch (error) {
      console.error('Error updating ticket status:', error);
    } 
    finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <motion.div
        className={`inline-flex items-center px-3 py-1 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${isAdmin ? 'cursor-pointer' : ''}`}
        onClick={() => isAdmin && !isUpdating && setIsOpen(!isOpen)}
        whileHover={isAdmin ? { scale: 1.05 } : {}}
        animate={{ opacity: isUpdating ? 0.7 : 1 }}
        title={isAdmin ? "Click to change status" : "Ticket status"}
      >
        {isUpdating ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            <span className="capitalize">
              {status.replace('-', ' ')}
            </span>
            {isAdmin && (
              <FaChevronDown className={`ml-1 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            )}
          </>
        )}
      </motion.div>
      
      {isOpen && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1"
        >
          {statusOptions.map(option => (
            <div
              key={option}
              onClick={() => handleStatusChange(option)}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer capitalize transition-colors"
            >
              {option.replace('-', ' ')}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default TicketStatusBadge;
