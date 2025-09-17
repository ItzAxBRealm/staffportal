import React from 'react';
import { motion } from 'motion/react';
import { FaTicketAlt, FaExclamationTriangle, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, iconColor, bgColor, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${bgColor} p-5 rounded-lg shadow-md flex flex-col cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value || 0}</h3>
        </div>
        <div className={`p-2 rounded-full ${iconColor}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

const TicketStats = () => {
  const { ticketStats, loading } = useSelector((state) => state.tickets);
  const navigate = (path) => () => window.location.href = path;

  const statCards = [
    {
      title: 'Total Tickets',
      value: ticketStats.total,
      icon: <FaTicketAlt size={24} className="text-blue-700 dark:text-blue-300" />,
      iconColor: 'bg-blue-100 dark:bg-blue-900',
      bgColor: 'bg-white dark:bg-gray-800',
      onClick: navigate('/tickets?filter=all')
    },
    {
      title: 'Open Tickets',
      value: ticketStats.open,
      icon: <FaExclamationTriangle size={24} className="text-yellow-600 dark:text-yellow-300" />,
      iconColor: 'bg-yellow-100 dark:bg-yellow-900',
      bgColor: 'bg-white dark:bg-gray-800',
      onClick: navigate('/tickets?status=open')
    },
    {
      title: 'In Progress',
      value: ticketStats.inProgress,
      icon: <FaSpinner size={24} className="text-purple-600 dark:text-purple-300" />,
      iconColor: 'bg-purple-100 dark:bg-purple-900',
      bgColor: 'bg-white dark:bg-gray-800',
      onClick: navigate('/tickets?status=in-progress')
    },
    {
      title: 'Resolved',
      value: ticketStats.resolved,
      icon: <FaCheckCircle size={24} className="text-green-600 dark:text-green-300" />,
      iconColor: 'bg-green-100 dark:bg-green-900',
      bgColor: 'bg-white dark:bg-gray-800',
      onClick: navigate('/tickets?status=resolved')
    }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Ticket Overview</h2>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md animate-pulse h-24"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconColor={card.iconColor}
              bgColor={card.bgColor}
              onClick={card.onClick}
            />
          ))}
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <Link
          to="/tickets"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          View all tickets →
        </Link>
      </div>
    </div>
  );
};

export default TicketStats;
