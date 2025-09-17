import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDarkMode } from '../hooks/useDarkMode.jsx';
import { Link } from 'react-router-dom';
import { updatePhoneNumber } from '../stores/thunks/authThunks';
import { toast } from 'sonner';

const UserProfilePage = () => {
  const { isDark } = useDarkMode();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [phoneError, setPhoneError] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  
  const validatePhoneNumber = (phone) => {
    if (!phone.trim()) {
      return true; 
    }
    const phoneRegex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
    return phoneRegex.test(phone.trim());
  };
  
  const handlePhoneUpdate = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid Australian phone number (e.g. 0412 345 678 or +61412345678)');
      return;
    }
    
    setPhoneLoading(true);
    setPhoneError('');
    
    try {
      await dispatch(updatePhoneNumber(phoneNumber.trim() || null)).unwrap();
      toast.success('Phone number updated successfully');
      setIsEditingPhone(false);
    } catch (error) {
      setPhoneError(error || 'Failed to update phone number');
      toast.error(error || 'Failed to update phone number');
    } finally {
      setPhoneLoading(false);
    }
  };
  
  const handlePhoneCancel = () => {
    setPhoneNumber(user?.phoneNumber || '');
    setPhoneError('');
    setIsEditingPhone(false);
  };
  
  return (
    <div className={`mt-12 max-w-4xl mx-auto p-6 rounded-xl shadow-md ${
      isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
    }`}>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {isAuthenticated && user ? (
        <div className="mb-8">
          <div className="mb-6 p-6 rounded-lg ${
            isDark ? 'bg-gray-700 border-blue-200/50' : 'bg-gray-50 border-blue-200/50'
          }">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">{user.fullName}</h2>
                <p className={`${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>{user.jobRole}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Phone Number</p>
                <p className="font-medium">{user.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Role</p>
                <p className="font-medium">{user.isAdmin ? 'Administrator' : 'Staff Member'}</p>
              </div>
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Last Login</p>
                <p className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-6 border rounded-lg text-center ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <p className="mb-4">Please log in to view your profile details.</p>
          <Link 
            to="/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
        </div>
      )}
      
      {isAuthenticated && user && (
        <>
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Account Security
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 dark:bg-gradient-to-r dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${isDark ? 'bg-blue-800/30' : 'bg-blue-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Password</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last changed: {user.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <Link 
                  to="/change-password" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Change
                </Link>
              </div>
              
              <div className="flex items-center justify-between mb-3 pt-3 border-t border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${isDark ? 'bg-blue-800/30' : 'bg-blue-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">Phone Number</h3>
                    {!isEditingPhone ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.phoneNumber || 'Not provided'}
                      </p>
                    ) : (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            setPhoneError('');
                          }}
                          placeholder="Enter phone number (optional)"
                          className={`w-full px-3 py-2 text-sm border rounded-md ${isDark 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' 
                            : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          } ${phoneError ? 'border-red-500' : ''}`}
                          disabled={phoneLoading}
                        />
                        {phoneError && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {phoneError}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handlePhoneUpdate}
                            disabled={phoneLoading}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {phoneLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handlePhoneCancel}
                            disabled={phoneLoading}
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {!isEditingPhone && (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                  >
                    {user.phoneNumber ? 'Change' : 'Add'}
                  </button>
                )}
              </div>

            </div>
          </div>
          
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Session Information
            </h2>
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Device</p>
                  <p className="font-medium">Web Browser</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Login Time</p>
                  <p className="font-medium">{new Date().toLocaleString()}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>IP Address</p>
                  <p className="font-medium">Protected</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Session Expires</p>
                  <p className="font-medium">After inactivity</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfilePage;
