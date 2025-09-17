import { MdOutlineWbSunny } from "react-icons/md";
import { IoMoonOutline, IoLogOutOutline } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { useDarkMode } from '../../hooks/useDarkMode.jsx';
import { logoutUser } from '../../stores/thunks/authThunks';
import NotificationCenter from '../common/NotificationCenter';

const Topbar = ({ title = 'Dashboard' }) => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const isMobile = useSelector(state => state.ui.isMobile);
  
  const dispatch = useDispatch();
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('rememberMe');
    
    dispatch(logoutUser());
    window.location.href = '/login';
  };
  
  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed top-0 right-0 flex items-center justify-between w-full h-[70px] pr-4 bg-[#F3F3F3] dark:bg-[#222831] shadow-lg z-10 ${isMobile ? 'hidden md:flex' : 'pl-[270px]'}`}
    >
        <div className='pl-4'>
            <h3 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>{title}</h3>
        </div>
        <div className='flex items-center justify-between gap-5'>
            <NotificationCenter />
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? 
                <MdOutlineWbSunny className='h-[30px] w-[30px] text-yellow-400' /> : 
                <IoMoonOutline className='h-[30px] w-[30px] text-blue-700' />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label="Logout"
            >
              <IoLogOutOutline className='h-[30px] w-[30px] text-red-600 dark:text-red-400' />
            </motion.button>
        </div>
    </motion.div>
  )
}

export default Topbar
