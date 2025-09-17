import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import AnnouncementCard from '../components/announcements/AnnouncementCard';
import { getAllAnnouncements } from '../stores/thunks/announcementThunks';
import { setCurrentAnnouncement } from '../stores/slices/announcementSlice';

const AnnouncementsPage = () => {
  const dispatch = useDispatch();
  const { announcements, loading, error } = useSelector(state => state.announcements);
  const [expandedId, setExpandedId] = useState(null);
  
  useEffect(() => {
    dispatch(getAllAnnouncements());
  }, [dispatch]);
  
  const handleAnnouncementClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      dispatch(setCurrentAnnouncement(null));
    } else {
      setExpandedId(id);
      const announcement = announcements.find(a => a._id === id);
      dispatch(setCurrentAnnouncement(announcement));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8"
    >
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10 dark:text-white">
          <h3 className="text-xl font-medium text-red-500">Error loading announcements</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => dispatch(getAllAnnouncements())}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4 max-w-4xl mx-auto">
          {announcements.map(announcement => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onClick={handleAnnouncementClick}
              expanded={expandedId === announcement._id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 dark:text-white">
          <h3 className="text-xl font-medium">No announcements available</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Check back later for updates</p>
        </div>
      )}
    </motion.div>
  );
};

export default AnnouncementsPage;
