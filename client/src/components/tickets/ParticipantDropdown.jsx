import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUserPlus, FaSpinner, FaSearch, FaTimes } from 'react-icons/fa';
import { getAllUsers } from '../../stores/thunks/userThunks';
import { toast } from 'sonner';
import api from '../../api/axios';

const ParticipantDropdown = ({ ticketId, participants = [], onParticipantAdded, onParticipantRemoved }) => {
  const dispatch = useDispatch();
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const participantIds = participants.map(p => typeof p === 'object' ? p._id : p);
  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = searchTerm === '' || (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) || (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const notParticipant = !participantIds.includes(user._id);
    const notCurrentUser = user._id !== currentUser?._id;
    return matchesSearch && notParticipant && notCurrentUser;
  });

  const handleAddParticipant = async (userId) => {
    setLoading(true);
    try {
      const response = await api.post(`/api/tickets/${ticketId}/participants`, {
        userId
      });
      
      toast.success('Participant added successfully');
      onParticipantAdded && onParticipantAdded(response.data.data);
      setIsOpen(false);
      setSearchTerm('');
    } 
    catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add participant');
    } 
    finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId) => {
    setLoading(true);
    try {
      await api.delete(`/api/tickets/${ticketId}/participants`, {
        data: { userId }
      });
      
      toast.success('Participant removed successfully');
      onParticipantRemoved && onParticipantRemoved(userId);
    } 
    catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove participant');
    } 
    finally {
      setLoading(false);
    }
  };

  const canManageParticipants = currentUser?.isAdmin || currentUser?.role === 'admin';

  if (!canManageParticipants) {
    return null;
  }

  if (usersLoading) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        <FaSpinner className="animate-spin mr-2 h-4 w-4" />
        Loading users...
      </div>
    );
  }

  return (
    <div className="relative">
      {participants.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Participants ({participants.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => {
              const participantData = typeof participant === 'object' ? participant : { _id: participant };
              return (
                <div
                  key={participantData._id}
                  className="flex items-center bg-[#e9d4cd] dark:bg-[#f3dfd8] text-[#d86641] dark:text-[#d67858] px-3 py-1 rounded-full text-sm"
                >
                  <span>@{participantData.fullName || participantData.email || 'Unknown User'}</span>
                  <button
                    onClick={() => handleRemoveParticipant(participantData._id)}
                    disabled={loading}
                    className="ml-2 text-[#e6977d] cursor-pointer dark:text-[#e6977d] hover:text-[#b9765f] dark:hover:text-[#b9765f] transition-colors"
                  >
                    <FaTimes className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center px-4 py-2 bg-[#947BD3] hover:bg-[#7964ad] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
      >
        <FaUserPlus className="mr-2 h-4 w-4" />
        Add Participant
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? 'No users found matching your search' : 'No users available to add'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleAddParticipant(user._id)}
                  disabled={loading}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 disabled:opacity-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                    {loading && <FaSpinner className="animate-spin h-4 w-4 text-gray-400" />}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};

export default ParticipantDropdown;
