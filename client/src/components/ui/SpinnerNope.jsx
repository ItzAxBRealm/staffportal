import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Spinner = ({ size = 'md', color = 'text-blue-500', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <FaSpinner 
        className={`animate-spin ${spinnerSize} ${color}`} 
        aria-label="Loading" 
      />
    </div>
  );
};

export default Spinner;
