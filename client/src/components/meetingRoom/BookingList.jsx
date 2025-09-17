import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings, deleteBooking } from '../../stores/thunks/meetingRoomThunks';
import { FiTrash2 } from 'react-icons/fi';
import { toast } from 'sonner';

function BookingList({ refreshKey, bookings: propBookings }) {
  const dispatch = useDispatch();
  const { bookings: reduxBookings, loading, error } = useSelector((state) => state.meetingRoom);
  const { user } = useSelector((state) => state.auth);
  const [sortOption, setSortOption] = useState('mostRecent');
  const [filterOption, setFilterOption] = useState('upcoming');
  const [visibleCount, setVisibleCount] = useState(10);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const bookings = propBookings || reduxBookings;

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    try {
      return new Date(dateStr);
    } 
    catch (error) {
      console.error("Date parsing error:", dateStr, error);
      return new Date(0);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    const currentTime = new Date();
    let result = [...bookings];

    if (filterOption === 'upcoming') {
      result = result.filter(booking => parseDate(booking.startTime) > currentTime);
    } 
    else if (filterOption === 'past') {
      result = result.filter(booking => parseDate(booking.startTime) < currentTime);
    }

    if (sortOption === 'mostRecent') {
      if(filterOption === 'past' || filterOption === 'all'){
        result.sort((a, b) => parseDate(b.startTime) - parseDate(a.startTime));
      }
      else{
        result.sort((a, b) => parseDate(a.startTime) - parseDate(b.startTime));
      }
    } 
    else if (sortOption === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [bookings, sortOption, filterOption]);

  useEffect(() => {
    if (!propBookings) {
      dispatch(fetchBookings());
    }
  }, [dispatch, refreshKey, propBookings]);

  const handleDeleteBooking = async (booking) => {
    if (!booking || !booking._id) return;
    const canDelete = user?.isAdmin || booking.bookedBy?._id === user?._id;
    
    if (!canDelete) {
      toast.error('You do not have permission to delete this booking.');
      return;
    }
    
    const confirmMessage = booking.isRecurring 
      ? 'This is a recurring booking. Do you want to delete all occurrences?'
      : 'Are you sure you want to delete this booking?';
    
    toast(confirmMessage, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            setDeletingBookingId(booking._id);
            await dispatch(deleteBooking({ 
              bookingId: booking._id, 
              deleteRecurring: booking.isRecurring 
            }));
            dispatch(fetchBookings());
            toast.success('Booking deleted successfully!');
          } 
          catch (error) {
            console.error('Failed to delete booking:', error);
            toast.error('Failed to delete booking. Please try again.');
          } 
          finally {
            setDeletingBookingId(null);
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  const formatDatePart = useMemo(() => (dateStr) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const formatTimePart = useMemo(() => (dateStr) => {
    const date = parseDate(dateStr);
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  useEffect(() => {
    setVisibleCount(10);
  }, [filterOption, sortOption]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-8 md:mb-2">
          {filterOption === 'upcoming' ? 'Upcoming' : filterOption === 'past' ? 'Past' : 'All'} Bookings
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sort:</label>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-1 pl-2 pr-8 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="mostRecent">Most Recent</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="filter" className="text-sm font-medium text-gray-700">Show:</label>
            <select
              id="filter"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-1 pl-2 pr-8 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <svg className="animate-spin h-6 w-6 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading bookings...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          No {filterOption === 'upcoming' ? 'upcoming' : filterOption === 'past' ? 'past' : ''} bookings found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organiser
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.slice(0, visibleCount).map((booking) => {
                    const isPast = parseDate(booking.startTime) < new Date();
                    return (
                      <tr 
                        key={booking._id} 
                        className={`hover:bg-gray-50 ${isPast ? 'opacity-80' : ''}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDatePart(booking.startTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimePart(booking.startTime)} - {formatTimePart(booking.endTime)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.title}
                            {isPast && <span className="ml-2 text-xs text-gray-500">(Completed)</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{booking.bookedBy?.fullName || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{booking.bookedBy?.email || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {booking.equipment && booking.equipment.includes('Zoom Meeting') 
                                ? 'Zoom' 
                                : 'Meeting Room'
                              }
                            </span>
                            {booking.isRecurring && (
                              <span className="ml-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Recurring</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(booking.equipment && booking.equipment.includes('Laptop')) && (
                            <div className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">
                                {booking.specialRequests 
                                  ? `Laptop, ${booking.specialRequests}` 
                                  : 'Laptop'
                                }
                              </span>
                            </div>
                          )}
                          {booking.specialRequests && !(booking.equipment && booking.equipment.includes('Laptop')) && (
                            <div className="text-sm text-gray-900 mt-1">
                              <span className="font-medium">Notes:</span> {booking.specialRequests}
                            </div>
                          )}
                          {booking.equipment && booking.equipment.length > 0 && (
                            <div className="text-sm text-gray-900 mt-1">
                              {booking.equipment
                                .filter(item => item !== 'Zoom Meeting' && item !== 'Laptop')
                                .map((item, index) => (
                                  <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                                    {item}
                                  </span>
                                ))
                              }
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const canDelete = user?.isAdmin || booking.bookedBy?._id === user?._id;
                            
                            return canDelete ? (
                              <button
                                onClick={() => handleDeleteBooking(booking)}
                                disabled={deletingBookingId === booking._id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete booking"
                              >
                                {deletingBookingId === booking._id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                                ) : (
                                  < FiTrash2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : null;
                          })()} 
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredBookings.length > visibleCount && (
            <div className="flex justify-center mt-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none transition-colors"
                onClick={() => setVisibleCount(prev => prev + 10)}
              >
                Load More ({filteredBookings.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BookingList;