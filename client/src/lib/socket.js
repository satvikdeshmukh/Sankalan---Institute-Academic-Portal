// Socket.io client — replaces Supabase Realtime subscriptions
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
    autoConnect: true,
    reconnectionDelay: 1000,
});

export default socket;
