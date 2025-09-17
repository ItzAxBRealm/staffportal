import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app, { httpServer, io } from './app.js';

dotenv.config({
    path: './.env'
});

connectDB()
    .then(() => {
        console.log('MongoDB connected successfully!');
        
        app.on("error", (error) => {
            console.error("Express App Error: ", error);
        });

        const PORT = process.env.PORT || 8080;
        
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 HTTP Server running on port ${PORT}`);
            console.log(`📡 WebSocket server running on port ${PORT}`);
            
            io.on('connection', (socket) => {
                console.log(`New client connected: ${socket.id}`);
                
                socket.on('disconnect', () => {
                    console.log(`Client disconnected: ${socket.id}`);
                });
            });
            
            io.engine.on('connection_error', (err) => {
                console.error('WebSocket connection error:', err.message);
                console.error('Error details:', err);
            });
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err);
        process.exit(1);
    });

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    httpServer.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    httpServer.close(() => process.exit(1));
});
