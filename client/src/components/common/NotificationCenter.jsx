import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FaBell, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaTimes, 
  FaCheck, 
  FaTrash,
  FaBellSlash,
  FaSpinner,
  FaWifi,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  addNotification,
  addMultipleNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  clearNotifications,
  removeNotification,
  markAllNotificationsAsRead
} from '../../stores/slices/uiSlice';
import api from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';

const useSocket = (userId) => {
  const dispatch = useDispatch();
  const dispatchRef = useRef(dispatch);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    if (!userId) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    const socketUrl = import.meta.env.VITE_WS_URL || 'localhost:5001';
    
    const socket = io(socketUrl, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'], 
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000, 
      forceNew: true   
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { room: `user_${userId}` });
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
    });

    socket.on('notification', (notification) => {
      dispatchRef.current(addNotification(notification));
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId]); 

  return { isConnected };
};

const useNotifications = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const { isConnected } = useSocket(user?._id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );
  
  const groupedNotifications = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    return notifications.reduce((groups, notification) => {
      const notificationDate = new Date(notification.timestamp).toDateString();
      let dateGroup;
      
      if (notificationDate === today) {
        dateGroup = 'Today';
      } 
      else if (notificationDate === yesterday) {
        dateGroup = 'Yesterday';
      } 
      else {
        dateGroup = 'Earlier';
      }
      
      if (!groups[dateGroup]) {
        groups[dateGroup] = [];
      }
      groups[dateGroup].push(notification);
      return groups;
    }, {});
  }, [notifications]);
  
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  const handleApiError = (error, action) => {
    const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
    setError(`Failed to ${action}: ${errorMessage}`);
    setTimeout(() => setError(null), 5000);
  };
  
  const notificationsRef = useRef(notifications);
  const loadingRef = useRef(false);
  const pageRef = useRef(page);
  const dispatchRef = useRef(dispatch);
  
  useEffect(() => {
    notificationsRef.current = notifications;
    loadingRef.current = isLoading;
    pageRef.current = page;
    dispatchRef.current = dispatch;
  }, [notifications, isLoading, page, dispatch]);
  
  const fetchNotifications = useCallback(async (loadMore = false) => {
    if (!user || loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const currentPage = loadMore ? pageRef.current + 1 : 1;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const response = await api.get('/api/notifications', { 
        params: { 
          includeRead: true,
          page: currentPage,
          limit: 20,
          since: sevenDaysAgo.toISOString()
        },
        timeout: 5000 
      });
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        const serverNotifications = new Map(
          response.data.data.map(n => [n._id, n])
        );
        
        notificationsRef.current.forEach(clientNotif => {
          const serverNotif = serverNotifications.get(clientNotif.id);
          if (serverNotif && serverNotif.read && !clientNotif.read) {
            dispatchRef.current(markNotificationAsRead(clientNotif.id));
          }
        });
        
        const newNotifications = [];
        response.data.data.forEach(notification => {
          const exists = notificationsRef.current.some(n => n.id === notification._id);
          if (!exists) {
            newNotifications.push({
              id: notification._id,
              type: notification.type,
              message: notification.message,
              link: notification.link,
              timestamp: notification.createdAt,
              read: notification.read || false
            });
          }
        });
        
        if (newNotifications.length > 0) {
          dispatchRef.current(addMultipleNotifications(newNotifications));
        }
        
        if (loadMore) {
          setPage(currentPage);
        }
        
        setHasMore(response.data.data.length === 20);
      }
    } 
    catch (error) {
      if (error.response?.status !== 404) {
        handleApiError(error, 'fetch notifications');
      }
    } 
    finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [user]); 
  
  const debouncedFetchNotifications = useMemo(
    () => debounce(fetchNotifications, 1000),
    [fetchNotifications]
  );
  
  const handleMarkAsRead = useCallback(async (notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
    
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
    } 
    catch (error) {
      dispatch(markNotificationAsUnread(notificationId));
      handleApiError(error, 'mark notification as read');
    }
  }, [dispatch]);
  
  const handleMarkAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    dispatch(markAllNotificationsAsRead());
    
    try {
      await api.patch('/api/notifications/read-all');
    } 
    catch (error) {
      unreadNotifications.forEach(notification => {
        dispatch(markNotificationAsUnread(notification.id));
      });
      handleApiError(error, 'mark all notifications as read');
    }
  }, [dispatch, notifications]);
  
  const handleRemoveNotification = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    dispatch(removeNotification(notificationId));
    
    try {
      await api.delete(`/api/notifications/${notificationId}`);
    } 
    catch (error) {
      if (notification) {
        dispatch(addNotification(notification));
      }
      handleApiError(error, 'delete notification');
    }
  }, [dispatch, notifications]);
  
  const handleClearAll = useCallback(async () => {
    const allNotifications = [...notifications];
    
    dispatch(clearNotifications());
    
    try {
      await api.delete('/api/notifications/delete-all');
      
      import('sonner').then(({ toast }) => {
        toast.success('All notifications cleared');
      });
    } 
    catch (error) {
      allNotifications.forEach(notification => {
        dispatch(addNotification(notification));
      });
      handleApiError(error, 'clear all notifications');
    }
  }, [dispatch, notifications]);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
    const intervalId = setInterval(() => {
      if (isOnline) {
        debouncedFetchNotifications();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [user, fetchNotifications, debouncedFetchNotifications, isOnline]);
  
  return {
    notifications,
    groupedNotifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    isOnline,
    hasMore,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleRemoveNotification,
    handleClearAll,
    fetchNotifications
  };
};

const NotificationCenter = ({ compact = false }) => {
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    isLoading,
    error,
    isOnline,
    hasMore,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleRemoveNotification,
    handleClearAll,
    fetchNotifications
  } = useNotifications();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const notificationRef = useRef(null);
  const notificationListRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
        setFocusedIndex(-1);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleKeyDown = useCallback((e) => {
    if (!showNotifications) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < notifications.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : notifications.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && notifications[focusedIndex]) {
          handleNotificationClick(notifications[focusedIndex]);
        }
        break;
      case 'Escape':
        setShowNotifications(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  }, [showNotifications, notifications, focusedIndex]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    setShowNotifications(false);
    setFocusedIndex(-1);
  };
  
  const handleClearAllWithConfirmation = () => {
    import('sonner').then(({ toast }) => {
      toast((toasted) => (
        <div className="flex flex-col space-y-4 p-4">
          <p className="text-gray-800 dark:text-gray-200">
            Are you sure you want to clear all notifications? This cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => toast.dismiss(t)}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200/80 hover:bg-gray-300/90 dark:bg-gray-700/80 dark:hover:bg-gray-600/90 text-gray-800 dark:text-gray-200 backdrop-blur-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleClearAll();
                toast.dismiss(toasted);
              }}
              className="px-4 py-2 text-sm rounded-lg bg-red-500/90 hover:bg-red-600/90 text-white backdrop-blur-sm transition-all"
            >
              Clear All
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-center',
        style: {
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '1rem',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        },
        className: 'dark:!bg-gray-800/90 dark:!border-gray-700',
      });
    });
  };
  
  const loadMoreNotifications = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(true);
    }
  };
  
  const formatNotificationLink = (link) => {
    if (!link) return '#';
    
    if (link.includes('/tickets/') || link.includes('/admin/tickets/')) {
      const ticketIdMatch = link.match(/\/(?:admin\/)?tickets\/([\w-]+)/);
      if (ticketIdMatch && ticketIdMatch[1]) {
        return `/tickets/${ticketIdMatch[1]}`;
      }
    }
    
    if (link.includes('/announcements/') || link.includes('/admin/announcements/')) {
      return '/announcements';
    }
    return link;
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <FaCheckCircle className="text-green-500" />;
      case 'error': return <FaExclamationCircle className="text-red-500" />;
      case 'warning': return <FaExclamationCircle className="text-yellow-500" />;
      case 'ticket': return <FaBell className="text-blue-500" />;
      case 'message': return <FaBell className="text-indigo-500" />;
      case 'announcement': return <FaInfoCircle className="text-purple-500" />;
      default: return <FaInfoCircle className="text-gray-500" />;
    }
  };
  
  return (
    <div className="relative inline-block text-left" ref={notificationRef}>
      <button
        onClick={() => setShowNotifications(prev => !prev)}
        className={`flex items-center justify-center cursor-pointer ${compact ? 'p-1' : 'p-2'} rounded-full relative hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
        aria-label="Notifications"
      >
        <FaBell className={`${compact ? 'h-5 w-5' : 'h-[24px] w-[24px]'} text-gray-600 dark:text-gray-200`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full ${compact ? 'h-4 w-4 text-[10px]' : 'h-5 w-5'} flex items-center justify-center`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            ref={notificationListRef}
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Notifications {unreadCount > 0 && `(${unreadCount} new)`}
                  </h3>
                  {isLoading && <FaSpinner className="animate-spin h-3 w-3 text-blue-500" />}
                  {!isOnline && <FaWifiSlash className="h-3 w-3 text-red-500" title="Offline" />}
                  {isOnline && <FaWifi className="h-3 w-3 text-green-500" title="Online" />}
                </div>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center cursor-pointer"
                      title="Mark all as read"
                    >
                      <FaCheck className="mr-1" /> Read all
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAllWithConfirmation}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center cursor-pointer"
                      title="Clear all notifications"
                    >
                      <FaTrash className="mr-1" /> Clear
                    </button>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-200">
                  {error}
                </div>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto" ref={notificationListRef}>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <FaBellSlash className="mx-auto h-8 w-8 mb-2 text-gray-300 dark:text-gray-600" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-1">We'll let you know when something new arrives</p>
                </div>
              ) : (
                <div>
                  {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                    <div key={dateGroup}>
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0">
                        {dateGroup}
                      </div>
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {groupNotifications.map((notification, index) => (
                          <li 
                            key={notification.id}
                            className={`${
                              !notification.read 
                                ? 'bg-blue-50 dark:bg-blue-900/20' 
                                : 'bg-white dark:bg-gray-800'
                            } ${
                              focusedIndex === notifications.indexOf(notification)
                                ? 'ring-2 ring-blue-500'
                                : ''
                            } hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150`}
                          >
                            <Link
                              to={notification.link ? formatNotificationLink(notification.link) : '#'}
                              onClick={() => handleNotificationClick(notification)}
                              className="block px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              tabIndex={showNotifications ? 0 : -1}
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${
                                    notification.read 
                                      ? 'text-gray-700 dark:text-gray-300' 
                                      : 'text-gray-900 dark:text-white font-semibold'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="mt-1 flex justify-between items-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                    </p>
                                    {!notification.read && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        New
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await handleRemoveNotification(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 rounded cursor-pointer"
                                  aria-label="Dismiss notification"
                                  tabIndex={showNotifications ? 0 : -1}
                                >
                                  <FaTimes className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div className="p-3 text-center border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={loadMoreNotifications}
                        disabled={isLoading}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 flex items-center justify-center mx-auto"
                      >
                        {isLoading ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Loading...
                          </>
                        ) : (
                          'Load more'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 text-center border-t border-gray-200 dark:border-gray-600">
                <Link
                  to="/notifications"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  tabIndex={showNotifications ? 0 : -1}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;