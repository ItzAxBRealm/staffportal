import React from 'react';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const TicketPriorityBadge = ({ priority }) => {
  const priorityValue = priority || 'Standard';
  
  const badgeConfig = {
    'Standard': {
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-300',
      icon: <FaInfoCircle className="mr-1 text-blue-600 dark:text-blue-400" />
    },
    'High Priority': {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-300',
      icon: <FaExclamationTriangle className="mr-1 text-red-600 dark:text-red-400" />
    }
  };

  const { bgColor, textColor, icon } = badgeConfig[priorityValue] || badgeConfig['Standard'];

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {priorityValue}
    </div>
  );
};

export default TicketPriorityBadge;
