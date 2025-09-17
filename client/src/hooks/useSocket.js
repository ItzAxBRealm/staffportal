import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { addNotification } from '../stores/slices/uiSlice';
import { addMessage } from '../stores/slices/messagesSlice';

const SOCKET_CONFIG = {
    path: '/socket.io',
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    autoConnect: true
};

export const useSocket = () => {
    const socketRef = useRef(null);
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { currentTicket } = useSelector(state => state.tickets);

    const createNotification = useCallback((notification, type) => {
        if (!notification?.metadata) return;

        if (notification.metadata.senderId === user?._id || 
            notification.metadata.createdBy === user?._id) {
            return;
        }

        if (currentTicket?._id === notification.metadata.ticketId) {
            return;
        }

        const baseLink = user?.isAdmin ? '/admin/tickets/' : '/tickets/';
        const link = notification.link || 
                    (notification.metadata.ticketId ? 
                     `${baseLink}${notification.metadata.ticketId}` : '/tickets');

        dispatch(addNotification({
            id: notification.id || `${type}-${Date.now()}`,
            type,
            title: notification.title || `New ${type}`,
            message: notification.message || `You have a new ${type}`,
            link,
            timestamp: notification.timestamp || new Date().toISOString(),
            metadata: notification.metadata
        }));
    }, [dispatch, user, currentTicket]);

    const setupSocket = useCallback(() => {
        if (!user?._id || socketRef.current?.connected) return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

	const wsUrl = import.meta.env.VITE_WS_URL
        const socket = io(wsUrl, {
            ...SOCKET_CONFIG,
            auth: { token }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join', { room: `user_${user._id}` });
            if (user.isAdmin) {
                socket.emit('join', { room: 'admin_room' });
            }
        });

        socket.on('disconnect', (reason) => {
        });

        socket.on('ticketNotification', (data) => createNotification(data, 'ticket'));
        socket.on('messageNotification', (data) => createNotification(data, 'message'));
        socket.on('announcementNotification', (data) => createNotification(data, 'announcement'));

        socket.on('newMessage', (data) => {
            if (data.ticketId === currentTicket?._id) {
                dispatch(addMessage(data));
            }
        });

        return socket;
    }, [user, currentTicket, dispatch, createNotification]);

    useEffect(() => {
        const socket = setupSocket();
        
        return () => {
            if (socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [setupSocket]);

    return { socket: socketRef.current };
};

export default useSocket;