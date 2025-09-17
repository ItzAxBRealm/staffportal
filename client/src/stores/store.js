import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import ticketReducer from './slices/ticketSlice';
import uiReducer from './slices/uiSlice';
import announcementReducer from './slices/announcementSlice';
import usersReducer from './slices/usersSlice';
import userReducer from './slices/userSlice';
import faqReducer from './slices/faqSlice';
import messagesReducer from './slices/messagesSlice';
import meetingRoomReducer from './slices/meetingRoomSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        tickets: ticketReducer,
        ui: uiReducer,
        announcements: announcementReducer,
        users: usersReducer,
        user: userReducer,
        faqs: faqReducer,
        messages: messagesReducer,
        meetingRoom: meetingRoomReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
})

export default store;