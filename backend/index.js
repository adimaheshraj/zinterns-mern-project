require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./db/connection');
const { ensureDefaultUsers } = require('./controllers/auth');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for local testing
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

// Configure Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Mount API Routes
app.use('/api', routes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Socket.IO Notifications System
io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`);

  // Join user room
  socket.on('join_user', (userId) => {
    socket.join(userId);
    logger.info(`👤 User ${userId} joined their personal socket room`);
  });

  // Join department room
  socket.on('join_dept', (deptName) => {
    socket.join(deptName);
    logger.info(`🏢 User joined department room: ${deptName}`);
  });

  // Broadcast events
  socket.on('send_notification', (data) => {
    // data: { targetUserId, targetDept, title, message, type }
    if (data.targetUserId) {
      io.to(data.targetUserId).emit('new_notification', data);
    } else if (data.targetDept) {
      io.to(data.targetDept).emit('new_notification', data);
    } else {
      io.emit('new_notification', data);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Start Server & Connect Database
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await ensureDefaultUsers();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ZInterns Server is running on port ${PORT}`);
    console.log(`👉 API Endpoint: http://localhost:${PORT}/api`);
  });
}

startServer();
