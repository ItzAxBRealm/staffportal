import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DarkLogo, Logo } from '../../assets';
import { useDarkMode } from '../../hooks/useDarkMode';
import { FiHome, FiUser } from "react-icons/fi";
import { LuMegaphone } from "react-icons/lu";
import { TiTicket } from "react-icons/ti";
import { FaQuestion, FaChevronDown, FaChevronUp, FaTachometerAlt, FaQuestionCircle, FaBullhorn, FaUsers, FaUserShield, FaCalendarAlt, FaLink } from "react-icons/fa";
import { MdAssignmentInd } from "react-icons/md";
import { useSelector } from 'react-redux';
import { selectHasAdminPermissions, selectShouldShowAssignedTickets } from '../../stores/slices/authSlice';
import { motion, AnimatePresence } from 'motion/react';

const dropdownVariants = {
  hidden: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      duration: 0.5
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const navItems = [
  { id: 1, title: 'Dashboard', path: '/' },
  { id: 2, title: 'Announcements', path: '/announcements' },
  { id: 3, title: 'Meeting Room Calendar', path: '/bookings' },
  { id: 4, title: 'Tickets', path: '/tickets' },
  { id: 5, title: 'Frequently Asked Questions', path: '/faq' },
  { id: 6, title: 'Admin Dashboard', path: '/admin' },
];

const Navbar = ({ onTitleChange }) => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [openAdminDropdown, setOpenAdminDropdown] = useState(false);
  const [openConnectDropdown, setOpenConnectDropdown] = useState(false);
  const location = useLocation();
  const hasAdminPermissions = useSelector(selectHasAdminPermissions);
  const shouldShowAssignedTickets = useSelector(selectShouldShowAssignedTickets);
  const { isDark } = useDarkMode();

  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = navItems.find(item => {
      if (currentPath === '/' && item.path === '/') return true;
      return currentPath !== '/' && item.path !== '/' && currentPath.startsWith(item.path);
    });

    if (currentItem) {
      setActiveItem(currentItem.title);
      onTitleChange(currentItem.title);
    }
  }, [location, onTitleChange]);

  return (
    <div className="fixed z-20 left-0 top-0 w-[250px] h-full bg-[#F3F3F3] dark:bg-[#222831] pt-[20px]">
      <div className="flex flex-col p-4">
        <div className="mb-8 flex items-center justify-center flex-col">
          {isDark ? (
            <img src={DarkLogo} height={100} width={100} alt="Logo" />
          ) : (
            <img src={Logo} height={100} width={100} alt="Logo" />
          )}
        </div>
        
        <nav className="flex">
          <ul className='flex flex-col space-y-2 w-full'>
            <li className='flex items-center justify-center w-full'>
              <NavLink 
                to="/" 
                className={({isActive}) =>
                  `flex flex-row items-center gap-2 p-2 rounded-md w-full ${isActive? "bg-[#1A1A1A] dark:text-black dark:bg-white text-white" : "active:bg-gray-500 hover:bg-gray-300 dark:text-white dark:hover:bg-gray-800"} transition-all ease-in-out duration-200`
                }
              >
               <FiHome className='h-[20px] w-[20px]' /> Home
              </NavLink>
            </li>

            <div 
              className='relative w-full transition-all ease-in-out duration-400'
              onMouseEnter={() => setOpenConnectDropdown(true)}
              onMouseLeave={() => setOpenConnectDropdown(false)}
            >
              <button
                className='flex flex-row items-center justify-between p-2 rounded-md w-full active:bg-gray-500 hover:bg-gray-300 dark:text-white dark:hover:bg-gray-800 transition-all ease-in-out duration-400'
              >
                <div className='flex flex-row items-center gap-2'>
                  <FaLink className='h-[20px] w-[20px]' />
                  <span>Connect</span>
                </div>
                {openConnectDropdown ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              <AnimatePresence>
                {openConnectDropdown && (
                  <motion.div 
                    className='absolute left-full ml-1 top-0 w-56 z-50'
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className='bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-150px)] overflow-y-auto'>
                      <ul className='py-1'>
                        {[
                          { path: '/announcements', name: 'Announcements', icon: <LuMegaphone className='min-w-[20px]' /> },
                          { path: '/faq', name: 'FAQ', icon: <FaQuestion className='min-w-[20px]' /> },
                          { path: '/tickets', name: 'Tickets', icon: <TiTicket className='min-w-[20px]' /> },
                          { path: '/bookings', name: 'Meeting Room', icon: <FaCalendarAlt className='min-w-[20px]' /> },
                        ].map((item) => (
                          <li key={item.path}>
                            <NavLink
                              to={item.path}
                              onClick={() => setActiveItem(item.name)}
                              className={({isActive}) =>
                                `flex items-center gap-2 px-4 py-2 text-sm ${isActive ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} dark:text-white transition-colors`
                              }
                            >
                              {item.icon}
                              <span>{item.name}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {shouldShowAssignedTickets && (
              <li className='flex items-center justify-center w-full'>
                <NavLink 
                  to="/admin/tickets/assigned" 
                  className={({isActive}) =>
                    `flex flex-row items-center gap-2 p-2 rounded-md w-full ${isActive? "bg-[#1A1A1A] dark:text-black dark:bg-white text-white" : "active:bg-gray-500 hover:bg-gray-300 dark:text-white dark:hover:bg-gray-800"} transition-all ease-in-out duration-200`
                  }
                >
                  <MdAssignmentInd className='h-[20px] w-[20px]' /> Assigned Tickets
                </NavLink>
              </li>
            )}

            <li className='flex items-center justify-center w-full'>
              <NavLink 
                to="/profile" 
                className={({isActive}) =>
                  `flex flex-row items-center gap-2 p-2 rounded-md w-full ${isActive? "bg-[#1A1A1A] dark:text-black dark:bg-white text-white" : "active:bg-gray-500 hover:bg-gray-300 dark:text-white dark:hover:bg-gray-800"} transition-all ease-in-out duration-200`
                }
              >
                <FiUser className='h-[20px] w-[20px]' /> My Profile
              </NavLink>
            </li>

            {hasAdminPermissions && (
              <div 
                className='relative w-full transition-all ease-in-out duration-400'
                onMouseEnter={() => setOpenAdminDropdown(true)}
                onMouseLeave={() => setOpenAdminDropdown(false)}
              >
                <button
                  className='flex flex-row items-center justify-between p-2 rounded-md w-full active:bg-gray-500 hover:bg-gray-300 dark:text-white dark:hover:bg-gray-800 transition-all ease-in-out duration-400'
                >
                  <div className='flex flex-row items-center gap-2'>
                    <FaUserShield className='h-[20px] w-[20px]' />
                    <span>Admin</span>
                  </div>
                  {openAdminDropdown ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                <AnimatePresence>
                  {openAdminDropdown && (
                    <motion.div 
                      className='absolute left-full ml-1 top-0 w-56 z-50'
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className='bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-150px)] overflow-y-auto'>
                        <ul className='py-1'>
                          {[
                            { path: '/admin', name: 'Dashboard', icon: <FaTachometerAlt className='min-w-[20px]' /> },
                            { path: '/admin/faq', name: 'Manage FAQ', icon: <FaQuestionCircle className='min-w-[20px]' /> },
                            { path: '/admin/announcements', name: 'Announcements', icon: <FaBullhorn className='min-w-[20px]' /> },
                            { path: '/admin/users', name: 'User Management', icon: <FaUsers className='min-w-[20px]' /> },
                          ].map((item) => (
                            <li key={item.path}>
                              <NavLink
                                to={item.path}
                                onClick={() => setActiveItem(item.name)}
                                className={({isActive}) =>
                                  `flex items-center gap-2 px-4 py-2 text-sm ${isActive ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} dark:text-white transition-colors`
                                }
                              >
                                {item.icon}
                                <span>{item.name}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Navbar