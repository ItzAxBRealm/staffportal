import { createSlice } from '@reduxjs/toolkit';

let savedNotifications = [];
try {
  const savedNotificationsString = localStorage.getItem('notifications');
  if (savedNotificationsString) {
    savedNotifications = JSON.parse(savedNotificationsString);
  }
} catch (error) {
  console.error('Error loading notifications from localStorage:', error);
}

const initialState = {
  sidebarOpen: true,
  notifications: savedNotifications || [],
  activeTab: 'dashboard',
  isMobile: false,
  isLoading: false,
  modalOpen: false,
  modalContent: null,
  modalType: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    addNotification(state, action) {
      const { id, type, message, link, timestamp } = action.payload;
      
      const notificationExists = state.notifications.some(
        notification => notification.id === id
      );
      
      if (!notificationExists && id && message) {
        state.notifications.unshift({
          id,
          type: type || 'info',
          message,
          link: link || null,
          timestamp: timestamp || new Date().toISOString(),
          read: false
        });
        
        if (state.notifications.length > 100) {
          state.notifications = state.notifications.slice(0, 100);
        }
        
        try {
          localStorage.setItem('notifications', JSON.stringify(state.notifications));
        } catch (error) {
          console.error('Error saving notifications to localStorage:', error);
        }
      }
    },
    addMultipleNotifications(state, action) {
      const newNotifications = action.payload;
      if (!Array.isArray(newNotifications) || newNotifications.length === 0) return;
      
      const existingIds = new Set(state.notifications.map(n => n.id));
      const uniqueNewNotifications = newNotifications
        .filter(n => n.id && n.message && !existingIds.has(n.id))
        .map(n => ({
          id: n.id,
          type: n.type || 'info',
          message: n.message,
          link: n.link || null,
          timestamp: n.timestamp || new Date().toISOString(),
          read: n.read || false
        }));
      
      if (uniqueNewNotifications.length > 0) {
        state.notifications = [...uniqueNewNotifications, ...state.notifications]
          .slice(0, 100);
        
        try {
          localStorage.setItem('notifications', JSON.stringify(state.notifications));
        } catch (error) {
          console.error('Error saving notifications to localStorage:', error);
        }
      }
    },
    removeNotification(state, action) {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      
      try {
        localStorage.setItem('notifications', JSON.stringify(state.notifications));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
    },
    markNotificationAsRead(state, action) {
      const notification = state.notifications.find(
        notification => notification.id === action.payload
      );
      if (notification) {
        notification.read = true;
        
        try {
          localStorage.setItem('notifications', JSON.stringify(state.notifications));
        } catch (error) {
          console.error('Error saving notifications to localStorage:', error);
        }
      }
    },
    clearNotifications(state) {
      state.notifications = [];
      
      try {
        localStorage.setItem('notifications', JSON.stringify(state.notifications));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
    },
    markAllNotificationsAsRead(state) {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      
      try {
        localStorage.setItem('notifications', JSON.stringify(state.notifications));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
    },
    markNotificationAsUnread(state, action) {
      const notification = state.notifications.find(
        notification => notification.id === action.payload
      );
      if (notification) {
        notification.read = false;
        
        try {
          localStorage.setItem('notifications', JSON.stringify(state.notifications));
        } catch (error) {
          console.error('Error saving notifications to localStorage:', error);
        }
      }
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    setMobileView(state, action) {
      state.isMobile = action.payload;
      if (action.payload) {
        state.sidebarOpen = false;
      }
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    openModal(state, action) {
      state.modalOpen = true;
      state.modalContent = action.payload.content;
      state.modalType = action.payload.type;
    },
    closeModal(state) {
      state.modalOpen = false;
      state.modalContent = null;
      state.modalType = null;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  addMultipleNotifications,
  removeNotification,
  markNotificationAsRead,
  clearNotifications,
  markAllNotificationsAsRead,
  markNotificationAsUnread,
  setActiveTab,
  setMobileView,
  setLoading,
  openModal,
  closeModal
} = uiSlice.actions;

export default uiSlice.reducer;
