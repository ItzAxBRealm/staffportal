import React from 'react';
import { motion } from 'motion/react';
import { MdOutlineWbSunny } from "react-icons/md";
import { IoMoonOutline } from "react-icons/io5";
import { useDarkMode } from '../../hooks/useDarkMode.jsx';

const DarkMode = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleDarkMode}
      className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${isDark ? 
        'bg-gray-700 hover:bg-gray-600' : 
        'bg-gray-100 hover:bg-gray-200'
      }`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative h-6 w-6 flex items-center justify-center">
        <motion.div
          className="absolute"
          initial={{ opacity: 0, rotate: -180 }}
          animate={{ 
            opacity: isDark ? 1 : 0, 
            rotate: isDark ? 0 : -180,
            scale: isDark ? 1 : 0.5 
          }}
          transition={{ duration: 0.3 }}
        >
          <MdOutlineWbSunny className="h-6 w-6 text-yellow-400" />
        </motion.div>
        
        <motion.div
          className="absolute"
          initial={{ opacity: 0, rotate: 180 }}
          animate={{ 
            opacity: isDark ? 0 : 1, 
            rotate: isDark ? 180 : 0,
            scale: isDark ? 0.5 : 1 
          }}
          transition={{ duration: 0.3 }}
        >
          <IoMoonOutline className="h-6 w-6 text-blue-700" />
        </motion.div>
      </div>
    </motion.button>
  );
};

export default DarkMode;