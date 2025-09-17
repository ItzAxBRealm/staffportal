import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectHasAdminPermissions } from '../../stores/slices/authSlice';
import api from '../../api/axios';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const hasAdminPermissions = useSelector(selectHasAdminPermissions);
  const [stats, setStats] = useState({
    users: 0,
    faqs: 0,
    announcements: 0,
    tickets: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        try {
          const response = await api.get('/api/admin/stats');
          const data = response.data.data;
          
          setStats({
            users: data.users || 0,
            faqs: data.faqs || 0,
            announcements: data.announcements || 0,
            tickets: data.tickets || 0
          });
          
        } catch (apiError) {
          
          try {
            const [usersRes, faqsRes, announcementsRes] = await Promise.allSettled([
              api.get('/api/users/count'),
              api.get('/api/faqs/count'),
              api.get('/api/announcements/count')
            ]);
            
            setStats({
              users: usersRes.status === 'fulfilled' ? usersRes.value?.data?.data?.count || 0 : 0,
              faqs: faqsRes.status === 'fulfilled' ? faqsRes.value?.data?.data?.count || 0 : 0,
              announcements: announcementsRes.status === 'fulfilled' ? announcementsRes.value?.data?.data?.count || 0 : 0,
              tickets: 0 
            });
          } catch (countsError) {
            console.error('Failed to fetch individual counts:', countsError);
            toast.error('Could not retrieve dashboard statistics', { id: 'stats-error' });
            setStats({
              users: 0,
              faqs: 0,
              announcements: 0,
              tickets: 0
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setError('Failed to load admin statistics. Please try again.');
        setLoading(false);
      }
    };
    
    if (hasAdminPermissions) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [hasAdminPermissions]);

  if (!hasAdminPermissions) {
    return (
      <div className="p-8 text-center">
        <h2 className="dark:text-white text-2xl font-bold mb-4">Admin Access Required</h2>
        <p className="dark:text-white mb-6">You don't have permission to access this page.</p>
        <Link 
          to="/" 
          className="px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#947BD3]"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="dark:text-white text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="dark:text-white mb-6">{error}</p>
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
      <h1 className="dark:text-white text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard 
          title="Users" 
          value={stats.users} 
          link="/admin/users" 
          linkText="Manage Users"
          bgColor="bg-[#FAF3F0]"
        />
        <DashboardCard 
          title="FAQs" 
          value={stats.faqs} 
          link="/admin/faq" 
          linkText="Manage FAQs"
          bgColor="bg-[#D4E2D4]"
        />
        <DashboardCard 
          title="Announcements" 
          value={stats.announcements} 
          link="/admin/announcements" 
          linkText="Manage Announcements"
          bgColor="bg-[#FFCACC]"
        />
        <DashboardCard 
          title="Tickets" 
          value={stats.tickets} 
          link="/tickets" 
          linkText="View Tickets"
          bgColor="bg-[#DBC4F0]"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="dark:text-white text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              to="/admin/faq/new" 
              className="block px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors"
            >
              Add New FAQ
            </Link>
            <Link 
              to="/admin/announcements/new" 
              className="block px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors"
            >
              Post Announcement
            </Link>
            <Link 
              to="/admin/users" 
              className="block px-4 py-2 bg-[#947BD3] text-white rounded hover:bg-[#7964ad] transition-colors"
            >
              Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, link, linkText, bgColor }) => (
  <div className={`p-6 rounded-lg shadow ${bgColor} dark:bg-gray-800`}>
    <h3 className="dark:text-white text-lg font-medium">{title}</h3>
    <p className="dark:text-white text-3xl font-bold my-2">{value}</p>
    <Link 
      to={link} 
      className="text-[#947BD3] hover:text-[#7964ad] dark:text-[#947BD3] dark:hover:text-[#7964ad] font-medium"
    >
      {linkText} →
    </Link>
  </div>
);

export default AdminDashboard;
