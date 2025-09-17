import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import path from 'path'
import fs from 'fs'

const app = express();
const __dirname = path.resolve();
const publicPath = path.join(__dirname, 'public');
const serverUploadsPath = path.join(publicPath, 'uploads');
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientUploadsPath = path.join(clientDistPath, 'uploads');

[serverUploadsPath, clientUploadsPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use('/uploads', (req, res, next) => {
  const clientFilePath = path.join(clientUploadsPath, req.path);
  const serverFilePath = path.join(serverUploadsPath, req.path);
  
  if (fs.existsSync(clientFilePath)) {
    return res.sendFile(clientFilePath);
  }
  
  if (fs.existsSync(serverFilePath)) {
    return res.sendFile(serverFilePath);
  }
  
  next();
});

app.use(express.static(publicPath));
console.log('Serving static files from:', publicPath);

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:8080'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    path: '/socket.io/',
    serveClient: false,
    connectTimeout: 10000,
    pingTimeout: 5000,
    pingInterval: 10000,
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    httpCompression: true,
    maxHttpBufferSize: 1e8
});

io.engine.on('connection_error', (err) => {
    console.error('[Socket.IO] Connection error:', err.message);
    console.error('Error details:', err);
});

io.engine.on('initial_headers', (headers, req) => {
    headers['Access-Control-Allow-Credentials'] = 'true';
});

console.log('[Socket.IO] Server configured with CORS origin:', process.env.CORS_ORIGIN || '*');

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    socket.on('join', ({ room }, callback) => {
        try {
            if (!room) {
                throw new Error('Room name is required');
            }
            socket.join(room);
            console.log(`Socket ${socket.id} joined room: ${room}`);
            
            if (typeof callback === 'function') {
                callback({ status: 'success', message: `Joined room: ${room}` });
            }
        } 
        catch (error) {
            console.error('Error joining room:', error);
            if (typeof callback === 'function') {
                callback({ status: 'error', message: error.message });
            }
        }
    });
    
    socket.on('join_ticket', (ticketId) => {
        if (ticketId) {
            socket.join(ticketId);
            console.log(`Socket ${socket.id} joined ticket room: ${ticketId}`);
        }
    });

    socket.on('leave_ticket', (ticketId) => {
        if (ticketId) {
            socket.leave(ticketId);
            console.log(`Socket ${socket.id} left ticket room: ${ticketId}`);
        }
    });
    
    socket.on("disconnect", (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    socket.on("error", (error) => {
        console.error(`Socket error (${socket.id}):`, error);
    });
});

setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    console.log('Active rooms:', Array.from(rooms.keys()));
}, 30000);

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:8080'],
    credentials: true
}));

app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true, limit: "50mb"}));
app.use(express.static("public"));
app.use(cookieParser());

const tempUploadDir = path.resolve("./public/temp");
const uploadsDir = path.resolve("./public/uploads");

if (!fs.existsSync(tempUploadDir)) {
    console.log(`Creating temp directory: ${tempUploadDir}`);
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating uploads directory: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/', (req, res) => {
    res.send('Staff Portal API is running!');
});
app.use(routes);

app.use((err, req, res, next) => {
    console.error("ERROR: ", err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

export { httpServer, io };
export default app;