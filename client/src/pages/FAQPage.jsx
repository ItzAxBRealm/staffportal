import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import FAQCard from '../components/faq/FAQCard';
import { getAllFaqs } from '../stores/thunks/faqThunks';

const FAQPage = () => {
  const dispatch = useDispatch();
  const { faqs, loading, error } = useSelector(state => state.faqs);
  
  useEffect(() => {
    dispatch(getAllFaqs());
  }, [dispatch]);
  
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
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h3 className="text-xl font-medium text-red-500 dark:text-red-400">Error loading FAQs</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => dispatch(getAllFaqs())}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : faqs && faqs.length > 0 ? (
        <FAQCard faqs={faqs} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h3 className="text-xl font-medium dark:text-white">No FAQs available</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Check back later for updates</p>
        </div>
      )}
    </motion.div>
  );
};

export default FAQPage;
