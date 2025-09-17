import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUserPlus, FaSpinner } from 'react-icons/fa';
import { getAllAdmins } from '../../stores/thunks/userThunks';
import { toast } from 'sonner';


const AdminAssignDropdown = ({ currentAssignee }) => {
  const dispatch = useDispatch();
  const { admins, loading: adminsLoading } = useSelector((state) => state.user);
  const { loading: ticketLoading } = useSelector((state) => state.tickets);

  useEffect(() => {
    dispatch(getAllAdmins());
  }, [dispatch]);

  const currentAssigneeId = typeof currentAssignee === 'object' ? currentAssignee?._id : currentAssignee;
  const assignableAdmins = admins.filter(admin => {
    return admin.isAdmin === true;
  });


  const handleAssign = async (event) => {
    const adminId = event.target.value;
    if (!adminId || adminId === '') return;

    try {
      toast.success('Ticket assigned successfully');
      if (window.location.pathname.includes('/tickets/')) {
        window.location.reload();
      }
    } 
    catch (error) {
      toast.error(error?.message || error || 'Failed to assign ticket');
    }
  };

  const isLoading = adminsLoading || ticketLoading;

  if (isLoading) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
        Loading admins...
      </div>
    );
  }

  if (assignableAdmins.length === 0) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        <FaUserPlus className="mr-2 h-4 w-4" />
        No system administrators available
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <FaUserPlus className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
      <select
        value={currentAssigneeId || ''}
        onChange={handleAssign}
        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#947BD3] focus:border-[#7964AD] cursor-pointer"
        style={{ minWidth: '200px' }}
      >
        <option value="">Assign to System Admin</option>
        {assignableAdmins.map((admin) => (
          <option key={admin._id} value={admin._id} >
            {admin.fullName}
          </option>
        ))}
      </select>
    </div>
  );
};


export default AdminAssignDropdown;
