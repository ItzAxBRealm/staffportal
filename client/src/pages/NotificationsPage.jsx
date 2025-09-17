import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle,
  FaTimes,
  FaCheck,
  FaTrash
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { 
  markNotificationAsRead, 
  markNotificationAsUnread,
  removeNotification,
  markAllNotificationsAsRead,
  clearNotifications,
  addNotification
} from '../stores/slices/uiSlice';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.ui);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const groupedNotifications = React.useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    return notifications.reduce((groups, notification) => {
      const date = new Date(notification.timestamp).toDateString();
      let groupName = date;
      
      if (date === today) {
        groupName = 'Today';
      } else if (date === yesterday) {
        groupName = 'Yesterday';
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      
      groups[groupName].push(notification);
      return groups;
    }, {});
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <FaExclamationCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <FaInfoCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      dispatch(markNotificationAsRead(notificationId));
      await api.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      dispatch(markNotificationAsUnread(notificationId));
      await api.put(`/api/notifications/${notificationId}/unread`);
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  };

  const handleRemoveNotification = async (notificationId) => {
    try {
      dispatch(removeNotification(notificationId));
      await api.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      dispatch(markAllNotificationsAsRead());
      await api.put('/api/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleClearAll = useCallback(() => {
    import('sonner').then(({ toast }) => {
      toast.custom(
        (t) => (
          <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTrash className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  Clear all notifications?
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
            <div className="mt-3 flex justify-end space-x-3">
              <button
                onClick={() => toast.dismiss(t)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const allNotifications = [...notifications];
                  dispatch(clearNotifications());
                  
                  toast.dismiss(t);
                  
                  try {
                    const deletePromises = allNotifications.map(notification => 
                      api.delete(`/api/notifications/${notification.id}`)
                    );
                    
                    Promise.all(deletePromises)
                      .then(() => {
                        toast.success('All notifications cleared');
                      })
                      .catch((error) => {
                        allNotifications.forEach(notification => {
                          dispatch(addNotification(notification));
                        });
                        toast.error('Failed to clear notifications');
                        console.error('Failed to clear notifications:', error);
                      });
                  } catch (error) {
                    allNotifications.forEach(notification => {
                      dispatch(addNotification(notification));
                    });
                    toast.error('Failed to clear notifications');
                    console.error('Failed to clear notifications:', error);
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear All
              </button>
            </div>
          </div>
        ),
        { duration: 10000 }
      );
    });
  }, [dispatch, notifications]);

  const loadMoreNotifications = async () => {
    if (isLoading || !hasMore) return;
    
    try {
      setIsLoading(true);
      const nextPage = page + 1;
      const response = await api.get(`/api/notifications?page=${nextPage}&limit=20`);
      
      if (response.data.notifications.length === 0) {
        setHasMore(false);
      } else {
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNotificationLink = (link) => {
    if (!link) return '/';
    
    if (!link.startsWith('/')) {
      link = '/' + link;
    }
    
    return link;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Notifications</h1>
        <div className="flex space-x-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaCheck className="mr-2" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FaTrash className="mr-2" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">You have no notifications</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(groupedNotifications).map(([date, notifs]) => (
            <div key={date} className="divide-y divide-gray-200 dark:divide-gray-700">
              <h2 className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300">
                {date}
              </h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifs.map((notification) => (
                  <li key={notification.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={formatNotificationLink(notification.link)}
                            className={`text-sm font-medium ${
                              notification.read 
                                ? 'text-gray-700 dark:text-gray-300' 
                                : 'text-gray-900 dark:text-white font-semibold'
                            }`}
                          >
                            {notification.message}
                          </Link>
                          <div className="flex space-x-2 ml-2">
                            <button
                              onClick={() => notification.read 
                                ? handleMarkAsUnread(notification.id)
                                : handleMarkAsRead(notification.id)
                              }
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {notification.read ? 'Mark as unread' : 'Mark as read'}
                            </button>
                            <button
                              onClick={() => handleRemoveNotification(notification.id)}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          {notification.link && (
                            <Link 
                              to={formatNotificationLink(notification.link)}
                              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View details
                            </Link>
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMoreNotifications}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
