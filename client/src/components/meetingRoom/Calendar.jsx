import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from "@fullcalendar/interaction";
import { FaTrashAlt } from "react-icons/fa";
import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBookings } from '../../stores/thunks/meetingRoomThunks';

const australianLocale = {
  code: 'en-au',
  week: {
    dow: 1,
    doy: 4
  },
  buttonText: {
    prev: 'Prev',
    next: 'Next',
    today: 'Today',
    week: 'Week',
    day: 'Day',
    list: 'List'
  },
  weekText: 'W',
  weekTextLong: 'Week',
  closeHint: 'Close',
  timeHint: 'Time',
  eventHint: 'Event',
  allDayText: 'All day',
  moreLinkText: 'more',
  noEventsText: 'No events to display',
  formatDate: {
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    weekday: 'long'
  },
  dayHeaderFormat: { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit', 
    omitCommas: true,
    separator: '/'
  }
};

function Calendar({ onDateSelect, refreshKey, selectedSlots, bookings: propBookings }) {
  const [events, setEvents] = useState([]);
  const calendarRef = useRef(null);
  const dispatch = useDispatch();
  const { bookings: reduxBookings, loading } = useSelector((state) => state.meetingRoom);

  const bookings = propBookings || reduxBookings;

  useEffect(() => {
    if (!propBookings) {
      dispatch(fetchBookings());
    }
  }, [refreshKey, dispatch, propBookings]);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      formatBookingsForCalendar();
    }
  }, [bookings]);

  const formatBookingsForCalendar = () => {
    try {
      const formattedEvents = bookings.map(booking => {
        const convertToDate = (dateStr) => {
          try {
            return new Date(dateStr);
          } 
          catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return new Date(); 
          }
        };

        const startDate = convertToDate(booking.startTime);
        const endDate = convertToDate(booking.endTime);
        
        if (!startDate || !endDate) {
          console.warn('Skipping booking due to invalid dates:', booking);
          return null;
        }
        
        const userName = booking.bookedBy?.fullName || booking.bookedBy?.name || 'Unknown User';
        return {
          id: booking._id,
          title: booking.title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: '#BFACAA',
          borderColor: '#02020A',
          textColor: '#ffffff',
          extendedProps: {
            bookedBy: booking.bookedBy,
            equipment: booking.equipment,
            specialRequests: booking.specialRequests,
            isRecurring: booking.isRecurring,
            isAllDay: booking.isAllDay,
            originalTitle: booking.title,
            userName: userName
          }
        };
      }).filter(Boolean); 
      setEvents(formattedEvents);
    } 
    catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleDateSelect = (selectInfo) => {
    const start = selectInfo.start;
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    
    let slot = {
      start: start,
      end: end,
      allDay: false
    };

    const hasConflict = events.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      const hasOverlap = (
        (slot.start < eventEnd && slot.end > eventStart) || 
        (slot.start.getTime() === eventStart.getTime()) ||
        (slot.end.getTime() === eventEnd.getTime())
      );
      
      return hasOverlap;
    });

    if (hasConflict) {
      if (calendarRef.current) {
        calendarRef.current.getApi().unselect();
      }
      alert("This time slot is already booked!");
      return;
    }

    if (onDateSelect) {
      onDateSelect(slot);
    }
    if (calendarRef.current) {
      calendarRef.current.getApi().unselect();
    }
  };

  const clearSelection = () => {
    if (onDateSelect) {
      onDateSelect({ clearAll: true });
    }
    if (calendarRef.current) {
      calendarRef.current.getApi().unselect();
    }
  };

  const tempEvents = [];
  const addedSlots = new Set();
  
  if (selectedSlots && selectedSlots.length > 0) {
    selectedSlots.forEach((slot, index) => {
      if (slot && slot.start) {
        const slotKey = new Date(slot.start).getTime().toString();
        if (!addedSlots.has(slotKey)) {
          addedSlots.add(slotKey);
          tempEvents.push({
            id: `selected-slot-${index}`,
            title: 'Your Selection',
            start: slot.start,
            end: slot.end,
            color: '#4ade80',
            textColor: '#064e3b'
          });
        }
      }
    });
  }

  const allEvents = [...events, ...tempEvents];

  useEffect(() => {
    if (calendarRef.current){
      calendarRef.current.getApi().render();
    }
  }, [allEvents]);

  return (
    <>
        <div className='w-full h-auto mx-auto bg-white rounded-lg shadow-lg overflow-hidden'>
            {selectedSlots.length > 0 && (
              <div className="mb-4 p-4 flex flex-col md:flex-row justify-between items-center border-b border-gray-100">
                <div className="text-sm font-medium text-[#7643b1] bg-[#f4eefc] px-3 py-1.5 rounded-full mb-2 md:mb-0">
                  {selectedSlots.length > 0 
                    ? `${selectedSlots.length} time slot${selectedSlots.length !== 1 ? 's' : ''} selected` 
                    : 'Time slot selected'}
                </div>
                <button 
                  onClick={clearSelection}
                  className="inline-flex items-center gap-3 text-sm font-bold text-[#ec5c4c] hover:text-[#b62313] bg-[#a7a09f]/30 hover:bg-[#b49693]/70 px-3 py-1.5 rounded-full cursor-pointer transition"
                >
                  <FaTrashAlt className='h-4 w-4' /> Clear Selection
                </button>
              </div>
            )}
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              events={allEvents}
              selectable={true}
              select={handleDateSelect}
              height="auto"
              slotMinTime="08:00:00"
              slotMaxTime="17:00:00"
              weekends={false}
              allDaySlot={false}
              eventDisplay="block"
              eventTextColor="#000"
              eventTimeFormat={{ 
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                meridiem: false
              }}
              eventDidMount={(info) => {
                const userName = info.event.extendedProps.userName;
                const originalTitle = info.event.title;
                info.el.innerHTML = '';
                const container = document.createElement('div');
                container.style.cssText = `
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                  width: 100%;
                  padding: 3px;
                  box-sizing: border-box;
                  overflow: hidden;
                `;
                const titleDiv = document.createElement('div');
                titleDiv.textContent = originalTitle;
                titleDiv.style.cssText = `
                  font-size: 0.75rem;
                  font-weight: 600;
                  color: #ffffff;
                  line-height: 1.1;
                  margin-bottom: 2px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  padding: 1px 4px;
                `;
                const userDiv = document.createElement('div');
                userDiv.textContent = userName;
                userDiv.style.cssText = `
                  font-size: 0.65rem;
                  font-weight: 400;
                  color: #ffffff;
                  padding: 1px 4px;
                  border-radius: 3px;
                  line-height: 1.1;
                  text-align: left;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                `;
                container.appendChild(titleDiv);
                container.appendChild(userDiv);
                info.el.appendChild(container);
                info.el.style.cssText += `
                  border-radius: 4px;
                  border: 1px solid rgba(0,0,0,0.1);
                  overflow: hidden;
                  min-height: 2.5em;
                `;
              }}
              locale={australianLocale}
              dayHeaderFormat={{
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }}
            />
        </div>
    </>
  );
}

export default Calendar;
