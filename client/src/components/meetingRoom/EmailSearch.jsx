import React, { useState } from 'react';
import { z } from 'zod';
import { FiSearch, FiUser } from 'react-icons/fi';
import FormInput from '../ui/FormInput';
import api from '../../api/axios';

const EmailSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [formData, setFormData] = useState({ email: '' });
  const [formErrors, setFormErrors] = useState({});

  const emailSchema = z.object({
    email: z.string().email('Invalid email').min(1, 'Email is required')
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = emailSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach(err => {
        if (err.path && err.path.length > 0) {
          errors[err.path[0]] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await api.get('/api/meetingRoom/user-bookings', {
        params: { 
          email: formData.email,
          limit: 20 
        }
      });
      
      if (response.data && response.data.success) {
        setSearchResults(response.data.data || []);
      } 
      else {
        setError('No bookings found for this email address');
      }
    } 
    catch (err) {
      console.error('Error searching bookings:', err);
      setError(err.response?.data?.message || 'An error occurred while searching');
    } 
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FiSearch className="text-[#3C787E]" />
        Search Bookings by Email
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-grow">
            <FormInput
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
              className=""
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-[#02020A] text-white rounded-md hover:bg-[#090918d2] focus:outline-none cursor-pointer ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-b-2 border-gray-200"></div>
          <p className="mt-2 text-gray-600">Searching...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {hasSearched && !isLoading && searchResults.length === 0 && !error && (
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 px-4 py-3 rounded-md mb-4">
          No bookings found for this email address.
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
            <FiUser className="text-green-600" />
            Found Bookings ({searchResults.length})
          </h3>
          <div className="space-y-2">
            {searchResults.map((booking) => {
              const startDate = new Date(booking.startTime);
              const endDate = new Date(booking.endTime);
              const isUpcoming = startDate > new Date();
              return (
                <div 
                  key={booking._id} 
                  className={`p-3 border rounded-lg transition-colors ${
                    isUpcoming 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{booking.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isUpcoming 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Date:</strong> {startDate.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Time:</strong> {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Booked by:</strong> {booking.bookedBy?.fullName} ({booking.bookedBy?.email})
                      </div>
                      {booking.specialRequests && (
                        <div className="text-sm text-gray-600 mt-1">
                          <strong>Special Requests:</strong> {booking.specialRequests}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSearch;
