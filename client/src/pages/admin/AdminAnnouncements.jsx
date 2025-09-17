import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { selectIsAdmin } from '../../stores/slices/authSlice';
import {
  selectAnnouncements,
  setAnnouncements,
  addAnnouncement,
  updateAnnouncement
} from '../../stores/slices/announcementSlice';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import api from '../../api/axios';

const AdminAnnouncements = ({ mode = 'view' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: announcementId } = useParams(); 
  const isAdmin = useSelector(selectIsAdmin);
  const announcements = useSelector(selectAnnouncements);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (mode === 'view') {
          console.log('Fetching announcements...');
          const response = await api.get('/api/announcements');
          
          let announcements = [];
          const data = response.data;
          
          if (data.data && Array.isArray(data.data)) {
            announcements = data.data;
          } else if (data.announcements && Array.isArray(data.announcements)) {
            announcements = data.announcements;
          } else if (Array.isArray(data)) {
            announcements = data;
          } else {
            console.warn('Could not find announcements array in response:', data);
          }
          
          dispatch(setAnnouncements(announcements));

        } else if (mode === 'edit' && announcementId) {
          const response = await api.get(`/api/announcements/${announcementId}`);
          
          let announcement;
          const data = response.data;
          
          if (data.data) {
            announcement = data.data;
          } else if (data.announcement) {
            announcement = data.announcement;
          } else {
            announcement = data;
          }
          
          setNewTitle(announcement.title || '');
          setNewContent(announcement.content || '');
          setPriority(announcement.priority || 'normal');
          setEditingAnnouncement(announcement);
        }
        setLoading(false);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mode, dispatch, announcementId]);

  const handleEditAnnouncement = (announcement) => {
    const announcementId = announcement.id || announcement._id;
    if (!announcementId) {
      toast.error('Invalid announcement ID');
      return;
    }
    navigate(`/admin/announcements/edit/${announcementId}`);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!announcementId) {
      toast.error('Invalid announcement ID');
      return;
    }

    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Announcement</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete this announcement?</p>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    performDeleteAnnouncement(announcementId);
                  }}
                  className="px-3 py-1 bg-red-600 rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  const performDeleteAnnouncement = async (announcementId) => {
    try {
      setLoading(true);
      
      await api.delete(`/api/announcements/${announcementId}`);
      
      const updatedAnnouncements = announcements.filter(
        announcement => {
          const id = announcement.id || announcement._id;
          return id !== announcementId;
        }
      );
      
      dispatch(setAnnouncements(updatedAnnouncements));
      
      toast.success('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter both a title and content for the announcement.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (mode === 'edit' && announcementId) {
        const response = await api.patch(`/api/announcements/${announcementId}`, {
          title: newTitle,
          content: newContent,
          priority: priority
        });
        
        let updatedAnnouncement;
        if (response.data.data) {
          updatedAnnouncement = response.data.data;
        } else if (response.data) {
          updatedAnnouncement = response.data;
        }
        
        if (updatedAnnouncement) {
          const announcementWithId = {
            ...updatedAnnouncement,
            id: updatedAnnouncement.id || updatedAnnouncement._id || announcementId
          };
          dispatch(setAnnouncements(
            announcements.map(a => 
              ((a.id === announcementId || a._id === announcementId) ? announcementWithId : a)
            )
          ));
          
          toast.success('Announcement updated successfully!');
        } else {
          console.error('Could not extract updated announcement data from response');
          toast.error('Error updating announcement');
        }

        navigate('/admin/announcements');

      } else {
        const response = await api.post('/api/announcements', {
          title: newTitle,
          content: newContent,
          priority: priority
        });
        
        const announcementData = response.data.data || response.data;
        
        if (announcementData) {
          dispatch(addAnnouncement(announcementData));
          setNewTitle('');
          setNewContent('');
          toast.success('Announcement posted successfully!');
        } else {
          console.error('Could not extract announcement data from response');
          toast.error('Error creating announcement');
        }
        navigate('/admin/announcements');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(error.message || 'Failed to save announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
        <p className="mb-6">You don't have permission to access this page.</p>
        <Link 
          to="/" 
          className="px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }
  
  if (loading && mode === 'view') {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {mode === 'view' ? (
        <>
          <h1 className="dark:text-white text-3xl font-bold mb-8">Announcements Management</h1>
          <div className="space-y-4">
            {announcements && announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div key={announcement._id || announcement.id} className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold dark:text-white">{announcement.title}</h2>
                        {announcement.priority && (
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                            announcement.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                            announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          }`}>
                            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {announcement.createdAt
                          ? new Date(announcement.createdAt).toLocaleDateString()
                          : 'Unknown date'}
                      </p>
                      <p className="mt-2 dark:text-gray-300">{announcement.content}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAnnouncement(announcement)}
                        className="p-2 text-[#947BD3] hover:text-[#7964ad] dark:text-[#947BD3] dark:hover:text-[#9d91be]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id || announcement._id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="dark:text-gray-300">No announcements found. Create your first announcement!</p>
              </div>
            )}
          </div>
          <div className="mt-8">
            <Link 
              to="/admin/announcements/new"
              className="px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Announcement
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="dark:text-white text-3xl font-bold mb-8">Create New Announcement</h1>
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium dark:text-white">Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Enter announcement title"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium dark:text-white">Content:</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  rows={6}
                  placeholder="Enter announcement content"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium dark:text-white">Priority:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-between">
                <Link
                  to="/admin/announcements"
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSubmitAnnouncement}
                  disabled={loading}
                  className={`px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnnouncements;
