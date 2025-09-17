import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAdmin, selectUser, selectIsSystemAdmin, selectHasAdminPermissions } from '../../stores/slices/authSlice';
import { FaUserShield, FaUserAlt, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';
import api from '../../api/axios';




const ManageUsers = () => {
  const isAdmin = useSelector(selectIsAdmin);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const hasAdminPermissions = useSelector(selectHasAdminPermissions);
  const currentUser = useSelector(selectUser);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  if (!hasAdminPermissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }
  
  const isReadOnlyMode = hasAdminPermissions && !isSystemAdmin;
  
  const getRoleLabel = (user) => {
    if (user.isAdmin) return 'Administrator';
    
    switch (user.role) {
      case 'staff':
        return 'User';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };
  
  const getRoleColor = (user) => {
    if (user.isAdmin) return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
    
    switch (user.role) {
      case 'staff':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'admin':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const isCurrentUser = (userId) => {
    return currentUser && (userId === currentUser._id || userId === currentUser.id);
  };


  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/users/all');
      
      const data = response.data;
      
      let usersData = [];
      
      if (data.data && Array.isArray(data.data)) {
        usersData = data.data;
      } else if (data.users && Array.isArray(data.users)) {
        usersData = data.users;
      } else if (Array.isArray(data)) {
        usersData = data;
      } else {
        console.warn('Could not find users array in response:', data);
        usersData = [];
      }
      
      const processedUsers = usersData.map(user => {
        return {
          _id: user._id || user.id || Math.random().toString(36).substring(2, 15),
          fullName: user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          email: user.email || 'No Email',
          username: user.username || user.email?.split('@')[0] || 'unknown',
          role: user.role || (user.isAdmin === true ? 'Administrator' : 'User'),
          isAdmin: user.isAdmin === true || user.role === 'Administrator' || user.role === 'Admin',
          isActive: user.isActive !== false, // Default to active unless explicitly false
          isSelf: currentUser && (
            (user._id && user._id === currentUser._id) ||
            (user.id && user.id === currentUser.id) ||
            (user.email && user.email === currentUser.email)
          )
        };
      });
      
      setUsers(processedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      
      if (error.response) {
        if (error.response.status === 404) {
          setError('User management API endpoint not found.');
        } else if (error.response.status === 403) {
          setError('You do not have permission to access this resource.');
        } else {
          const errorMsg = error.response.data?.message || `Error ${error.response.status}`;
          setError(errorMsg);
        }
      } else if (error.request) {
        setError('Unable to connect to the server. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);
  
  const handleToggleAdmin = async (userId) => {
    try {
      toast.loading('Updating admin status...');
      
      const response = await api.patch(`/api/users/admin/toggle-admin/${userId}`);
      
      const updatedUserData = response.data?.user || response.data?.data;
      
      setUsers(prevUsers => {
        return prevUsers.map(user => {
          if (user.id === userId || user._id === userId) {
            if (updatedUserData) {
              return {
                ...user,
                ...updatedUserData,
                isAdmin: updatedUserData.isAdmin === true || updatedUserData.role === 'admin' || updatedUserData.role === 'Admin' ||  updatedUserData.role === 'Administrator',
                role: updatedUserData.isAdmin ? 'Administrator' : 'User'
              };
            } else {
              return {
                ...user,
                role: user.isAdmin ? 'User' : 'Administrator',
                isAdmin: !user.isAdmin
              };
            }
          }
          return user;
        });
      });
      
      toast.dismiss();
      toast.success('User admin status updated successfully');
      
    } catch (error) {
      console.error('Failed to toggle admin status:', error);
      toast.dismiss();
      
      if (error.response?.status === 403) {
        toast.error('You do not have permission to change admin status');
      } else if (error.response?.status === 404) {
        toast.error('User not found');
      } else if (error.response?.status === 500) {
        toast.error(`Server error: ${error.response?.data?.message || 'Check your server logs for details'}`);
      } else {
        toast.error(`Failed to update admin status: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      }
      
      fetchUsers();
    }
  };




  const handleDeleteUser = (userId) => {
    const targetUser = users.find(user => (user._id || user.id) === userId);
    const userName = targetUser ? (targetUser.fullName || targetUser.username || 'this user') : 'this user';
    
    toast("Delete user?", {
      description: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      action: {
        label: "Delete",
        onClick: async () => {
          const loadingToastId = toast.loading(`Deleting ${userName}...`);
          
          try {
            // Make API call to delete user from backend
            await api.delete(`/api/users/admin/users/${userId}`);
            
            // Update frontend state only after successful backend deletion
            setUsers(prevUsers => {
              return prevUsers.filter(user => user.id !== userId && user._id !== userId);
            });
            
            toast.dismiss(loadingToastId);
            toast.success('User deleted successfully');
          } catch (error) {
            console.error('Failed to delete user:', error.response?.data || error.message);
            toast.dismiss(loadingToastId);
            
            // Provide specific error messages
            if (error.response?.status === 403) {
              toast.error('You do not have permission to delete this user');
            } else if (error.response?.status === 404) {
              toast.error('User not found');
            } else if (error.response?.status === 400) {
              toast.error(error.response?.data?.message || 'Cannot delete this user');
            } else {
              toast.error(error.response?.data?.message || 'Failed to delete user');
            }
            
            // Refresh users list to ensure UI is in sync with backend
            fetchUsers();
          }
        }
      },
      cancel: {
        label: "Cancel"
      },
      duration: 10000, // 10 seconds
    });
  };




  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="dark:text-white text-3xl font-bold mb-2">User Management</h1>
        {isReadOnlyMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              <span className="font-medium">Read-Only Mode:</span> You can view user information but cannot modify accounts.
            </p>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 p-4 rounded-md bg-red-50 mb-4">
          <p>{error}</p>
        </div>
      ) : null}
      
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                {isSystemAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {users && users.length > 0 ? users.map((user, index) => (
                <tr key={user._id || user.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        {user.isAdmin ? <FaUserShield className="text-blue-500" /> : <FaUserAlt className="text-gray-500" />}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || "Unknown User"}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username || "user"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email || "No Email"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user)}`}>
                      {getRoleLabel(user)}
                    </span>
                  </td>
                  {isSystemAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        {!user.isSelf && (
                          <>
                            {!user.isAdmin && (
                              <button
                                className="text-xs px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors cursor-pointer"
                                onClick={() => handleToggleAdmin(user._id || user.id)}
                                disabled={isCurrentUser(user._id)}
                                title={isCurrentUser(user._id) ? "You cannot change your own admin status" : "Make user an admin"}
                              >
                                Make Admin
                              </button>
                            )}
                            
                            {!user.isAdmin && (
                              <button 
                                onClick={() => handleDeleteUser(user._id || user.id)}
                                className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-700/30 dark:text-red-300 dark:hover:bg-red-700/50 px-2 py-1 rounded flex items-center cursor-pointer"
                              >
                                <FaTrash className="mr-1" /> Delete
                              </button>
                            )}
                          </>
                        )}
                        
                        {user.isSelf && (
                          <span className="text-gray-500 italic">Current User</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={isSystemAdmin ? "4" : "3"} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};




export default ManageUsers;
