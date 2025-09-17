import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    messages: [],
    loading: false,
    error: null,
    pendingReply: "",
    replyTo: null
};

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        startLoading(state) {
            state.loading = true;
            state.error = null;
        },
        setMessages(state, action) {
            state.messages = Array.isArray(action.payload) ? action.payload : [];
            state.loading = false;
            state.error = null;
        },
        addMessage(state, action) {
            const message = action.payload;
            if (!message || typeof message !== 'object') {
                console.error('Invalid message payload:', message);
                return;
            }

            if (!message.parentMessage) {
                state.messages.push(message);
            } else {
                const parentIndex = state.messages.findIndex(
                    msg => msg._id === message.parentMessage
                );
                
                if (parentIndex !== -1) {
                    if (!state.messages[parentIndex].replies) {
                        state.messages[parentIndex].replies = [];
                    }
                    state.messages[parentIndex].replies.push(message);
                }
            }
            state.loading = false;
            state.pendingReply = "";
            state.replyTo = null;
            state.error = null;
        },
        updateMessage(state, action) {
            const updatedMessage = action.payload;
            if (!updatedMessage || !updatedMessage._id) {
                console.error('Invalid message update payload:', updatedMessage);
                return;
            }
            
            if (!updatedMessage.parentMessage) {
                const index = state.messages.findIndex(msg => msg._id === updatedMessage._id);
                if (index !== -1) {
                    state.messages[index] = updatedMessage;
                }
            } else {
                const parentIndex = state.messages.findIndex(
                    msg => msg._id === updatedMessage.parentMessage
                );
                
                if (parentIndex !== -1 && state.messages[parentIndex].replies) {
                    const replyIndex = state.messages[parentIndex].replies.findIndex(
                        reply => reply._id === updatedMessage._id
                    );
                    if (replyIndex !== -1) {
                        state.messages[parentIndex].replies[replyIndex] = updatedMessage;
                    }
                }
            }
            
            state.loading = false;
            state.error = null;
        },
        deleteMessage(state, action) {
            const payload = action.payload;
            const messageId = typeof payload === 'string' ? payload : payload.messageId;
            const parentMessageId = typeof payload === 'object' ? payload.parentMessageId : null;
            
            if (!messageId) {
                console.error('No message ID provided for deletion');
                return;
            }
            
            if (!parentMessageId) {
                state.messages = state.messages.filter(
                    message => message._id !== messageId
                );
            } else {
                const parentIndex = state.messages.findIndex(
                    msg => msg._id === parentMessageId
                );
                
                if (parentIndex !== -1 && state.messages[parentIndex].replies) {
                    state.messages[parentIndex].replies = 
                        state.messages[parentIndex].replies.filter(
                            reply => reply._id !== messageId
                        );
                }
            }
            
            state.loading = false;
            state.error = null;
        },
        setPendingReply(state, action) {
            state.pendingReply = action.payload || "";
        },
        setReplyTo(state, action) {
            state.replyTo = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        clearMessageState(state) {
            Object.assign(state, initialState);
        },
        clearError(state) {
            state.error = null;
        }
    }
});

export const {
    startLoading,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    setPendingReply,
    setReplyTo,
    setError,
    clearMessageState,
    clearError
} = messagesSlice.actions;

export default messagesSlice.reducer;