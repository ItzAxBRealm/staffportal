import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DarkLogo, Logo } from '../../assets';
import { FiHome, FiUser } from "react-icons/fi";
import { LuMegaphone } from "react-icons/lu";
import { TiTicket } from "react-icons/ti";
import { FaQuestion, FaUserShield, FaBars, FaTimes, FaCalendarAlt, FaLink, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdAssignmentInd } from "react-icons/md";
import { MdOutlineWbSunny } from "react-icons/md";
import { IoMoonOutline, IoLogOutOutline } from "react-icons/io5";
import { useSelector, useDispatch } from 'react-redux';
import { selectHasAdminPermissions, selectShouldShowAssignedTickets } from '../../stores/slices/authSlice';
import { motion, AnimatePresence } from 'motion/react';
import { toggleSidebar } from '../../stores/slices/uiSlice';
import { useDarkMode } from '../../hooks/useDarkMode.jsx';
import { logoutUser } from '../../stores/thunks/authThunks';
import NotificationCenter from '../common/NotificationCenter';

const MobileNavbar = ({ onTitleChange }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const hasAdminPermissions = useSelector(selectHasAdminPermissions);
  const shouldShowAssignedTickets = useSelector(selectShouldShowAssignedTickets);
  const isSidebarOpen = useSelector(state => state.ui.sidebarOpen);
  const { isDark, toggleDarkMode } = useDarkMode();
  const [openConnectDropdown, setOpenConnectDropdown] = useState(false);
  
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === '/') {
      onTitleChange('Dashboard');
    } 
    else if (currentPath.startsWith('/announcements')) {
      onTitleChange('Announcements');
    } 
    else if (currentPath.startsWith('/bookings')) {
      onTitleChange('Meeting Room Calendar');
    } 
    else if (currentPath.startsWith('/tickets')) {
      onTitleChange('Tickets');
    } 
    else if (currentPath.startsWith('/faq')) {
      onTitleChange('FAQ');
    } 
    else if (currentPath.startsWith('/admin')) {
      onTitleChange('Admin Dashboard');
    } 
    else if (currentPath.startsWith('/profile')) {
      onTitleChange('My Profile');
    }
  }, [location, onTitleChange]);

  const toggleMobileMenu = () => {
    dispatch(toggleSidebar());
  };
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('rememberMe');
    
    dispatch(logoutUser());
    window.location.href = '/login';
  };
  
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-md z-30 flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none mr-2"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
          <div className="flex items-center">
            {isDark ? 
             <img src={DarkLogo} className="h-8 w-8" alt="Logo" /> :  
              <img src={Logo} className="h-8 w-8" alt="Logo" /> 
            }
            <h1 className="ml-2 text-lg font-semibold text-gray-800 dark:text-white truncate">
              {location.pathname === '/' ? 'Dashboard' : 
               location.pathname.startsWith('/announcements') ? 'Announcements' :
               location.pathname.startsWith('/tickets') ? 'Tickets' :
               location.pathname.startsWith('/faq') ? 'FAQ' :
               location.pathname.startsWith('/profile') ? 'My Profile' :
               location.pathname.startsWith('/admin') ? 'Admin' : 'Staff Portal'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <NotificationCenter compact={true} />
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? 
              <MdOutlineWbSunny className='h-5 w-5 text-yellow-400' /> : 
              <IoMoonOutline className='h-5 w-5 text-blue-700' />}
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Logout"
          >
            <IoLogOutOutline className='h-5 w-5 text-red-600 dark:text-red-400' />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={toggleMobileMenu}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-30 md:hidden pt-16"
          >
            <div className="p-4">
              <nav className="space-y-2">
                <NavLink 
                  to="/"
                  className={({isActive}) =>
                    `flex items-center p-3 rounded-md w-full ${
                      isActive 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                  onClick={toggleMobileMenu}
                >
                  <FiHome className="h-5 w-5 mr-3" />
                  <span>Home</span>
                </NavLink>

                <div className="space-y-1">
                  <button
                    onClick={() => setOpenConnectDropdown(!openConnectDropdown)}
                    className="flex items-center justify-between p-3 rounded-md w-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <FaLink className="h-5 w-5 mr-3" />
                      <span>Connect</span>
                    </div>
                    {openConnectDropdown ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  
                  <AnimatePresence>
                    {openConnectDropdown && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 space-y-1 overflow-hidden"
                      >
                        <NavLink 
                          to="/announcements"
                          className={({isActive}) =>
                            `flex items-center p-2 rounded-md w-full text-sm ${
                              isActive 
                              ? "bg-blue-500 text-white" 
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                          onClick={toggleMobileMenu}
                        >
                          <LuMegaphone className="h-4 w-4 mr-2" />
                          <span>Announcements</span>
                        </NavLink>

                        <NavLink 
                          to="/faq"
                          className={({isActive}) =>
                            `flex items-center p-2 rounded-md w-full text-sm ${
                              isActive 
                              ? "bg-blue-500 text-white" 
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                          onClick={toggleMobileMenu}
                        >
                          <FaQuestion className="h-4 w-4 mr-2" />
                          <span>FAQ</span>
                        </NavLink>

                        <NavLink 
                          to="/tickets"
                          className={({isActive}) =>
                            `flex items-center p-2 rounded-md w-full text-sm ${
                              isActive 
                              ? "bg-blue-500 text-white" 
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                          onClick={toggleMobileMenu}
                        >
                          <TiTicket className="h-4 w-4 mr-2" />
                          <span>Tickets</span>
                        </NavLink>

                        <NavLink 
                          to="/bookings"
                          className={({isActive}) =>
                            `flex items-center p-2 rounded-md w-full text-sm ${
                              isActive 
                              ? "bg-blue-500 text-white" 
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`
                          }
                          onClick={toggleMobileMenu}
                        >
                          <FaCalendarAlt className="h-4 w-4 mr-2" />
                          <span>Meeting Room</span>
                        </NavLink>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {shouldShowAssignedTickets && (
                  <NavLink 
                    to="/admin/tickets/assigned"
                    className={({isActive}) =>
                      `flex items-center p-3 rounded-md w-full ${
                        isActive 
                        ? "bg-blue-500 text-white" 
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                    onClick={toggleMobileMenu}
                  >
                    <MdAssignmentInd className="h-5 w-5 mr-3" />
                    <span>Assigned Tickets</span>
                  </NavLink>
                )}

                <NavLink 
                  to="/profile"
                  className={({isActive}) =>
                    `flex items-center p-3 rounded-md w-full ${
                      isActive 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`
                  }
                  onClick={toggleMobileMenu}
                >
                  <FiUser className="h-5 w-5 mr-3" />
                  <span>My Profile</span>
                </NavLink>

                {hasAdminPermissions && (
                  <NavLink 
                    to="/admin"
                    className={({isActive}) =>
                      `flex items-center p-3 rounded-md w-full ${
                        isActive || location.pathname.startsWith('/admin')
                        ? "bg-blue-500 text-white" 
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                    onClick={toggleMobileMenu}
                  >
                    <FaUserShield className="h-5 w-5 mr-3" />
                    <span>Admin</span>
                  </NavLink>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavbar;
