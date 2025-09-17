import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { FaExternalLinkAlt, FaSpinner, FaCalendarAlt, FaUsers } from 'react-icons/fa'
import AnnouncementCard from '../../components/announcements/AnnouncementCard'
import TicketCard from '../../components/tickets/TicketCard'
import FAQCard from '../../components/faq/FAQCard'
import { getUserTickets } from '../../stores/thunks/ticketThunks'
import { getAllAnnouncements } from '../../stores/thunks/announcementThunks'
import { getAllFaqs } from '../../stores/thunks/faqThunks'

const HomePage = () => {
  const dispatch = useDispatch()
  
  const { loading: announcementsLoading, announcements } = useSelector(state => state.announcements)
  const { userTickets, loading: ticketsLoading } = useSelector(state => state.tickets)
  const { faqs, loading: faqsLoading } = useSelector(state => state.faqs)
  const loading = announcementsLoading || ticketsLoading || faqsLoading
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        try {
          dispatch(getAllAnnouncements())
        } 
        catch (e) {
          console.error('Error fetching announcements:', e)
        }
        
        try {
          dispatch(getUserTickets())
        } 
        catch (e) {
          console.error('Error fetching tickets:', e)
        }
        
        try {
          dispatch(getAllFaqs())
        } 
        catch (e) {
          console.error('Error fetching FAQs:', e)
        }
      } 
      catch (error) {
        console.error('Error in dashboard data fetch:', error)
      }
    }
    
    fetchDashboardData()
  }, [dispatch]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-3 sm:p-4 md:p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-[#222831] rounded-lg shadow-md p-6 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold dark:text-white">Recent Announcements</h2>
            <Link to="/announcements" className="py-2 px-3 rounded-lg bg-black hover:bg-[#3b3b3b] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] cursor-pointer flex items-center">
              <span>View all</span>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">Stay updated with the latest announcements and important information.</p>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <FaSpinner className="animate-spin h-8 w-8 text-black" />
            </div>
          ) : announcements && announcements.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {announcements.slice(0, 2).map(announcement => (
                <AnnouncementCard key={announcement._id || announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No announcements available</p>
          )}
        </motion.div>
        
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-[#222831] rounded-lg shadow-md p-6 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold dark:text-white">Recent Tickets</h2>
            <Link to="/tickets" className="py-2 px-3 rounded-lg bg-black hover:bg-[#3b3b3b] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] cursor-pointer flex items-center">
              <span>View all</span>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">Track and manage your support tickets and requests.</p>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <FaSpinner className="animate-spin h-8 w-8 text-black" />
            </div>
          ) : userTickets && userTickets.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {userTickets.slice(0, 2).map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tickets available</p>
          )}
        </motion.div>
      </div>
      
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-[#947BD3] to-[#7964ad] rounded-lg shadow-lg p-6 mb-6 text-white"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="bg-white/20 rounded-full p-3 mr-4">
              <FaUsers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Meeting Room</h3>
              <p className="text-white/90 text-sm">Book a meeting for interviews, discussions, or project planning.</p>
            </div>
          </div>
          <Link
            to="/bookings"
            className="bg-white text-[#947BD3] hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
          >
            <FaCalendarAlt className="mr-2" />
            Book Now
          </Link>
        </div>
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-[#222831] rounded-lg shadow-md mt-4 p-4 sm:p-6 mb-4 sm:mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold dark:text-white">Frequently Asked Questions</h2>
          <Link to="/faq" className="py-2 px-3 rounded-lg bg-black hover:bg-[#3b3b3b] text-white dark:text-black dark:bg-white dark:hover:bg-[#EEEEEE] cursor-pointer flex items-center">
            <span>View all</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin h-8 w-8 text-black" />
          </div>
        ) : faqs && faqs.length > 0 ? (
          <FAQCard faqs={faqs} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No FAQs available</p>
        )}
      </motion.div>
    </motion.div>
  )
}

export default HomePage
