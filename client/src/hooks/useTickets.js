import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  getUserTickets,
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  deleteTicket
} from '../stores/thunks/ticketThunks';
import { setFilter } from '../stores/slices/ticketSlice';

export const useTickets = () => {
  const dispatch = useDispatch();
  const { 
    userTickets, 
    allTickets, 
    currentTicket, 
    loading, 
    error, 
    filter,
    images 
  } = useSelector(state => state.tickets);
  const { isAdmin } = useSelector(state => state.auth);

  const fetchTickets = useCallback((status = filter) => {
    if (isAdmin) {
      dispatch(getAllTickets(status));
    } else {
      dispatch(getUserTickets(status));
    }
  }, [dispatch, filter, isAdmin]);

  const fetchTicketById = useCallback((ticketId) => {
    return dispatch(getTicketById(ticketId));
  }, [dispatch]);

  const submitTicket = useCallback((ticketData) => {
    return dispatch(createTicket(ticketData));
  }, [dispatch]);

  const changeTicketStatus = useCallback((ticketId, status) => {
    if (!isAdmin) return Promise.reject('Unauthorized');
    return dispatch(updateTicketStatus({ ticketId, status }));
  }, [dispatch, isAdmin]);

  const removeTicket = useCallback((ticketId) => {
    if (!isAdmin) return Promise.reject('Unauthorized');
    return dispatch(deleteTicket(ticketId));
  }, [dispatch, isAdmin]);

  const changeFilter = useCallback((newFilter) => {
    dispatch(setFilter(newFilter));
  }, [dispatch]);

  const tickets = isAdmin ? allTickets : userTickets;

  return {
    tickets,
    currentTicket,
    loading,
    error,
    filter,
    images,
    fetchTickets,
    fetchTicketById,
    submitTicket,
    changeTicketStatus,
    removeTicket,
    changeFilter
  };
};

export default useTickets;
