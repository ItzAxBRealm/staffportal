import React from 'react';
import { FaInbox } from 'react-icons/fa';

const NoDataMessage = ({ 
  title = "No data found", 
  description = "There's nothing here at the moment", 
  icon: Icon = FaInbox 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
        <Icon size={40} className="text-gray-400 dark:text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold mb-2 dark:text-white">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">{description}</p>
    </div>
  );
};

export default NoDataMessage;
