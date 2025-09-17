import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    userTickets: [],
    allTickets: [], 
    currentTicket: null,
    loading: false,
    error: null,
    filter: 'open'
};

const ticketSlice = createSlice({
    name: 'tickets',
    initialState,
    reducers: {
        startLoading(state) {
            state.loading = true;
            state.error = null;
        },
        setUserTickets(state, action) {
            state.userTickets = Array.isArray(action.payload) ? action.payload : [];
            state.loading = false;
            state.error = null;
        },
        setAllTickets(state, action) {
            state.allTickets = Array.isArray(action.payload) ? action.payload : [];
            state.loading = false;
            state.error = null;
        },
        setCurrentTicket(state, action) {
            state.currentTicket = action.payload;
            state.loading = false;
            state.error = null;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        setFilter(state, action) {
            state.filter = action.payload || 'open';
        },
        createTicket(state, action) {
            const ticket = action.payload;
            if (!ticket) return;

            state.userTickets.unshift(ticket);
            
            if (state.allTickets.length > 0) {
                state.allTickets.unshift(ticket);
            }
            
            state.loading = false;
            state.error = null;
        },
        updateTicket(state, action) {
            const updatedTicket = action.payload;
            if (!updatedTicket || !updatedTicket._id) return;

            const updateTicketInArray = (tickets) => 
                tickets.map(ticket => 
                    ticket._id === updatedTicket._id ? updatedTicket : ticket
                );

            state.userTickets = updateTicketInArray(state.userTickets);
            
            if (state.allTickets.length > 0) {
                state.allTickets = updateTicketInArray(state.allTickets);
            }
            
            if (state.currentTicket && state.currentTicket._id === updatedTicket._id) {
                state.currentTicket = updatedTicket;
            }
            
            state.loading = false;
            state.error = null;
        },
        deleteTicket(state, action) {
            const ticketId = action.payload;
            if (!ticketId) return;

            const filterById = (tickets) => tickets.filter(ticket => ticket._id !== ticketId);

            state.userTickets = filterById(state.userTickets);
            
            if (state.allTickets.length > 0) {
                state.allTickets = filterById(state.allTickets);
            }
            
            if (state.currentTicket && state.currentTicket._id === ticketId) {
                state.currentTicket = null;
            }
            
            state.loading = false;
            state.error = null;
        },
        assignTicket(state, action) {
            const { ticketId, adminId } = action.payload;
            
            const userTicket = state.userTickets.find(t => t._id === ticketId);
            if (userTicket) {
                userTicket.assignedTo = adminId;
            }
            
            const allTicket = state.allTickets.find(t => t._id === ticketId);
            if (allTicket) {
                allTicket.assignedTo = adminId;
            }
            
            if (state.currentTicket && state.currentTicket._id === ticketId) {
                state.currentTicket.assignedTo = adminId;
            }

            state.loading = false;
            state.error = null;
        },
        addReply(state, action) {
            const { ticketId, reply } = action.payload;
            if (!ticketId || !reply) return;

            const addReplyToTicket = (ticket) => {
                if (ticket._id === ticketId) {
                    if (!ticket.messages) {
                        ticket.messages = [];
                    }
                    ticket.messages.push(reply);
                }
                return ticket;
            };

            if (state.currentTicket && state.currentTicket._id === ticketId) {
                if (!state.currentTicket.messages) {
                    state.currentTicket.messages = [];
                }
                state.currentTicket.messages.push(reply);
            }
            
            state.userTickets = state.userTickets.map(addReplyToTicket);
            
            if (state.allTickets.length > 0) {
                state.allTickets = state.allTickets.map(addReplyToTicket);
            }
            
            state.loading = false;
            state.error = null;
        },
        clearCurrentTicket(state) {
            state.currentTicket = null;
        },
        clearError(state) {
            state.error = null;
        }
    }
});

export const { 
    startLoading, 
    setUserTickets, 
    setAllTickets, 
    setCurrentTicket, 
    setError, 
    setFilter, 
    createTicket, 
    updateTicket, 
    deleteTicket,
    assignTicket,
    addReply,
    clearCurrentTicket,
    clearError
} = ticketSlice.actions;

export default ticketSlice.reducer;