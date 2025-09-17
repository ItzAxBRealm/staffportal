import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Navbar from './Navbar'
import Topbar from './Topbar'
import MobileNavbar from './MobileNavbar'
import { useSocket } from '../../hooks/useSocket'
import { setMobileView } from '../../stores/slices/uiSlice'

const RootLayout = () => {
  const dispatch = useDispatch();
  const [activeTitle, setActiveTitle] = useState('Dashboard');
  const isMobile = useSelector(state => state.ui.isMobile);
  useSocket();
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      dispatch(setMobileView(mobile));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);
  
  return (
    <div className="bg-[#d4d5e3] dark:bg-gray-900 min-h-screen w-full">
        {isMobile ? (
          <MobileNavbar onTitleChange={setActiveTitle} />
        ) : (
          <>
            <Navbar onTitleChange={setActiveTitle} />
            <Topbar title={activeTitle} />
          </>
        )}
        
        <main 
          className={`transition-all duration-300 ease-in-out p-4 bg-[#d4d5e3] dark:bg-gray-900 ${isMobile 
            ? 'pt-[70px]' 
            : 'ml-[250px] pt-[70px]'} 
            min-h-[calc(100vh-${isMobile ? '64px' : '70px'})]`}
        >
          <Outlet />
        </main>
    </div>
  )
}

export default RootLayout
