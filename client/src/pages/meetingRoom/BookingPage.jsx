import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Calendar from '../../components/meetingRoom/Calendar';
import BookingForm from '../../components/meetingRoom/BookingForm';
import BookingList from '../../components/meetingRoom/BookingList';
import EmailSearch from '../../components/meetingRoom/EmailSearch';
import { useDarkMode } from '../../hooks/useDarkMode';
import { fetchBookings, createBooking } from '../../stores/thunks/meetingRoomThunks';
import { addSelectedSlot, clearSelectedSlots, clearError } from '../../stores/slices/meetingRoomSlice';

const BookingPage = () => {
  const dispatch = useDispatch();
  const { isDarkMode } = useDarkMode();
  const { bookings, selectedSlots, loading, error } = useSelector((state) => state.meetingRoom);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch, refreshKey]);

  useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => {
        setBookingSuccess(false);
        setRefreshKey(prev => prev + 1);
        dispatch(clearSelectedSlots());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [bookingSuccess, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleDateSelect = (slot) => {
    if (slot && slot.clearAll) {
      dispatch(clearSelectedSlots());
      setBookingSuccess(false);
      return;
    }
    
    if (!slot) return;
    dispatch(addSelectedSlot(slot));
    setBookingSuccess(false);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (selectedSlots.length === 0) {
        throw new Error("Please select at least one time slot");
      }

      const bookingPromises = selectedSlots.map(async (slot) => {
        const equipment = [];
        if (values.zoomMeeting) {
          equipment.push('Zoom Meeting');
        }
        if (values.laptopNeeded) {
          equipment.push('Laptop');
        }
        if (values.equipment && Array.isArray(values.equipment)) {
          equipment.push(...values.equipment);
        }
        
        const bookingData = {
          title: values.title,
          startTime: slot.start,
          endTime: slot.end,
          isRecurring: values.recurring || false,
          recurringType: values.recurringType || 'weekly',
          recurringWeeks: parseInt(values.recurringWeeks || 1, 10),
          recurringEndDate: values.recurringEndDate,
          equipment: equipment,
          specialRequests: values.specialRequests,
          isAllDay: values.isAllDay || false
        };
        
        return dispatch(createBooking(bookingData));
      });

      const results = await Promise.all(bookingPromises);
      
      const allSuccessful = results.every(result => 
        result.type === 'meetingRoom/createBooking/fulfilled'
      );
      
      if (allSuccessful) {
        setBookingSuccess(true);
        setRefreshKey(prev => prev + 1);
        resetForm();
      } 
      else {
        const failedResults = results.filter(result => result.type !== 'meetingRoom/createBooking/fulfilled');
        throw new Error(failedResults[0]?.payload || 'Failed to create one or more bookings');
      }
      
    } 
    catch (error) {
      console.error('Booking error:', error);
      alert(error.message || 'Failed to create booking. Please try again.');
    } 
    finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`mx-auto p-4 md:p-6 lg:p-8 ${isDarkMode ? 'dark' : ''}`}>
      
      {bookingSuccess && (
        <div className="success-message mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg text-center text-sm md:text-base animate-fade-in-down">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Your booking has been successfully submitted!
          </div>
        </div>
      )}

      {error && (
        <div className="error-message mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg text-center text-sm md:text-base">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md mb-6">
            <Calendar 
              onDateSelect={handleDateSelect}
              refreshKey={refreshKey}
              selectedSlots={selectedSlots}
              bookings={bookings}
            />
          </div>
          <BookingList refreshKey={refreshKey} bookings={bookings} />
          <EmailSearch />
        </div>
        
        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Form</h2>
          <BookingForm 
            selectedSlot={selectedSlots.length > 0 ? selectedSlots[0] : null}
            selectedSlots={selectedSlots} 
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
