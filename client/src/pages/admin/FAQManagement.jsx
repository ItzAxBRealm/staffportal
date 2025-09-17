import { useState, useEffect } from 'react';
import FAQCard from '../../components/faq/FAQCard';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../../stores/slices/authSlice';
import { FiChevronDown, FiTrash2 } from 'react-icons/fi';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import api from '../../api/axios';

const FAQManagement = ({ mode = 'view' }) => {
  const isAdmin = useSelector(selectIsAdmin);
  const [faqs, setFaqs] = useState([]);
  const [currentMode, setCurrentMode] = useState(mode);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFAQs, setExpandedFAQs] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/faqs');
      
      setFaqs(response.data.data || response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setError('Failed to load FAQs. Please try again.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
  
    if (currentMode === 'view') {
      fetchFAQs();
    } else {
      setLoading(false);
    }
  }, [currentMode]);

  const toggleFAQ = (faqId) => {
    setExpandedFAQs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  const handleDeleteFAQ = (faqId) => {
    if (confirmDeleteId === faqId) {
      actuallyDeleteFAQ(faqId);
      return;
    }
    setConfirmDeleteId(faqId);
    
    setTimeout(() => {
      setConfirmDeleteId(null);
    }, 5000);
  };
  
  const actuallyDeleteFAQ = async (faqId) => {
    try {
      toast.loading('Deleting FAQ...', { id: 'delete-toast' });
      
      await api.delete(`/api/faqs/${faqId}`);
      setFaqs(prev => prev.filter(faq => (faq._id || faq.id) !== faqId));
      setConfirmDeleteId(null);
      
      toast.success('FAQ deleted successfully', { id: 'delete-toast' });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ', { id: 'delete-toast' });
      setConfirmDeleteId(null); 
    }
  };

  const handleAddFAQ = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Please provide both a question and an answer');
      return;
    }
    
    toast.promise(
      async () => {
        try {
          const response = await api.post('/api/faqs', {
            question: newQuestion,
            answer: newAnswer
          });
          
          const newFAQ = response.data.data || response.data;
          
          setFaqs([...faqs, newFAQ]);
          
          setNewQuestion('');
          setNewAnswer('');
          
          setTimeout(() => {
            setCurrentMode('view');
          }, 1000);
          
          return 'FAQ added successfully!';
      
        } 
        catch (error) {
          console.error('Error adding FAQ:', error);
          throw new Error(error.response?.data?.message || 'Failed to add FAQ');
        }
      },
      {
        loading: 'Adding FAQ...',
        success: 'FAQ added successfully!',
        error: (err) => `${err.message || 'Failed to add FAQ. Please try again.'}`
      }
    );
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="dark:text-white text-2xl font-bold">Admin Access Required</h2>
        <p className="dark:text-white">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 p-4 rounded-md bg-red-50 mb-4">
          <p>{error}</p>
        </div>
      ) : currentMode === 'view' ? (
        <>
          <h1 className="dark:text-white text-3xl font-bold mb-8">FAQ Management</h1>
          {faqs.length > 0 ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
              {faqs.map((faq) => {
                const faqId = faq._id || faq.id;
                const isExpanded = !!expandedFAQs[faqId];
                
                return (
                  <div key={faqId} className="border-b border-gray-200 dark:border-gray-700 py-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <button 
                        onClick={() => toggleFAQ(faqId)}
                        className="flex-grow text-left font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {faq.question}
                      </button>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => toggleFAQ(faqId)}
                          className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform ${isExpanded ? 'transform rotate-180 cursor-pointer' : ''}`}
                        >
                          <FiChevronDown className="text-gray-500 dark:text-gray-400 cursor-pointer" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFAQ(faqId)}
                          className={`p-1 rounded-full transition-all cursor-pointer ${confirmDeleteId === faqId 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                          aria-label={confirmDeleteId === faqId ? 'Click again to confirm deletion' : 'Delete FAQ'}
                          title={confirmDeleteId === faqId ? 'Click again to confirm deletion' : 'Delete FAQ'}
                        >
                          <FiTrash2 size={18} />
                          {confirmDeleteId === faqId && 
                            <span className="absolute top-0 right-0 -mr-1 -mt-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          }
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-2 pl-4 text-gray-600 dark:text-gray-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dark:text-white text-gray-500">No FAQs available yet.</p>
          )}
          <div className="mt-8">
            <button
              onClick={() => setCurrentMode('add')}
              className="px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] cursor-pointer"
            >
              Add New FAQ
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="dark:text-white text-3xl font-bold mb-8">Add New FAQ</h1>
          <div className="mt-8 p-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="space-y-4">
              <div>
                <label className="dark:text-white block mb-2">Question:</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="dark:text-white block mb-2">Answer:</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleAddFAQ}
                  className="px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] cursor-pointer"
                >
                  Add FAQ
                </button>
                <button
                  onClick={() => setCurrentMode('view')}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FAQManagement;
