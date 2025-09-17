import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    announcements: [],
    loading: false,
    error: null,
    currentAnnouncement: null
};

const announcementSlice = createSlice({
    name: 'announcements',
    initialState,
    reducers: {
        startLoading(state) {
            state.loading = true;
            state.error = null;
        },
        setAnnouncements(state, action) {
            state.announcements = action.payload;
            state.loading = false;
        },
        setCurrentAnnouncement(state, action) {
            state.currentAnnouncement = action.payload;
            state.loading = false;
        },
        addAnnouncement(state, action) {
            if (!Array.isArray(state.announcements)) {
                state.announcements = [];
            }
            state.announcements.unshift(action.payload);
            state.loading = false;
        },
        updateAnnouncement(state, action) {
            const updatedAnnouncement = action.payload;
            state.announcements = state.announcements.map(announcement => 
                announcement._id === updatedAnnouncement._id ? updatedAnnouncement : announcement
            );
            
            if (state.currentAnnouncement && state.currentAnnouncement._id === updatedAnnouncement._id) {
                state.currentAnnouncement = updatedAnnouncement;
            }
            
            state.loading = false;
        },
        deleteAnnouncement(state, action) {
            const announcementId = action.payload;
            state.announcements = state.announcements.filter(announcement => 
                announcement._id !== announcementId
            );
            
            if (state.currentAnnouncement && state.currentAnnouncement._id === announcementId) {
                state.currentAnnouncement = null;
            }
            
            state.loading = false;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

export const selectAnnouncements = (state) => state.announcements.announcements;
export const selectCurrentAnnouncement = (state) => state.announcements.currentAnnouncement;

export const { 
    startLoading,
    setAnnouncements,
    setCurrentAnnouncement,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    setError
} = announcementSlice.actions;

export default announcementSlice.reducer;
