import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    bookings: [],
    currentBooking: null,
    userBookings: [],
    loading: false,
    error: null,
    selectedSlots: [],
    availability: {
        available: true,
        conflicts: []
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalBookings: 0,
        hasNext: false,
        hasPrev: false
    },
    filters: {
        startDate: null,
        endDate: null,
        department: 'All',
        status: 'confirmed'
    }
};

const meetingRoomSlice = createSlice({
    name: 'meetingRoom',
    initialState,
    reducers: {
        startLoading(state) {
            state.loading = true;
            state.error = null;
        },
        setBookings(state, action) {
            state.bookings = action.payload.bookings || [];
            state.pagination = action.payload.pagination || state.pagination;
            state.loading = false;
        },
        setCurrentBooking(state, action) {
            state.currentBooking = action.payload;
            state.loading = false;
        },
        setUserBookings(state, action) {
            state.userBookings = action.payload.bookings || [];
            state.pagination = action.payload.pagination || state.pagination;
            state.loading = false;
        },
        addBooking(state, action) {
            if (!Array.isArray(state.bookings)) {
                state.bookings = [];
            }
            if (Array.isArray(action.payload)) {
                state.bookings.unshift(...action.payload);
            } else {
                state.bookings.unshift(action.payload);
            }
            state.loading = false;
        },
        updateBooking(state, action) {
            const index = state.bookings.findIndex(booking => booking._id === action.payload._id);
            if (index !== -1) {
                state.bookings[index] = action.payload;
            }
            if (state.currentBooking && state.currentBooking._id === action.payload._id) {
                state.currentBooking = action.payload;
            }
            state.loading = false;
        },
        removeBooking(state, action) {
            const bookingId = action.payload;
            state.bookings = state.bookings.filter(booking => booking._id !== bookingId);
            if (state.currentBooking && state.currentBooking._id === bookingId) {
                state.currentBooking = null;
            }
            state.loading = false;
        },
        setSelectedSlots(state, action) {
            state.selectedSlots = action.payload;
        },
        addSelectedSlot(state, action) {
            const slot = action.payload;
            const existingIndex = state.selectedSlots.findIndex(
                selected => new Date(selected.start).getTime() === new Date(slot.start).getTime()
            );
            
            if (existingIndex >= 0) {
                state.selectedSlots.splice(existingIndex, 1);
            } else {
                state.selectedSlots.push(slot);
            }
        },
        clearSelectedSlots(state) {
            state.selectedSlots = [];
        },
        setAvailability(state, action) {
            state.availability = action.payload;
            state.loading = false;
        },
        setFilters(state, action) {
            state.filters = { ...state.filters, ...action.payload };
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetBookingState(state) {
            state.currentBooking = null;
            state.selectedSlots = [];
            state.error = null;
        }
    }
});

export const {
    startLoading,
    setBookings,
    setCurrentBooking,
    setUserBookings,
    addBooking,
    updateBooking,
    removeBooking,
    setSelectedSlots,
    addSelectedSlot,
    clearSelectedSlots,
    setAvailability,
    setFilters,
    setError,
    clearError,
    resetBookingState
} = meetingRoomSlice.actions;

export default meetingRoomSlice.reducer;
