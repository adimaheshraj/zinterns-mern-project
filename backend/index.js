require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { User } = require('./models');
const { connectDB } = require('./db/connection');
const { ensureDefaultUsers } = require('./controllers/auth');
const routes = require('./routes');
const logger = require('./utils/logger');
const { teamRoom } = require('./utils/notifications');

const allowedOrigins = new Set([
  'http://40.192.120.59',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)
]);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed to access the ZInterns API.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions
});
app.set('io', io);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_zinterns_2026';

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.data.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = decoded.employeeId ? await User.findOne({ employeeId: decoded.employeeId }) : null;
    if (!user || user.status === 'disabled') {
      return next(new Error('Your account is not active.'));
    }
    socket.data.user = {
      ...decoded,
      department: user.department,
      team: user.team
    };
    return next();
  } catch (error) {
    return next(new Error('Invalid or expired notification session.'));
  }
});

// Configure Middlewares
app.use(helmet());
app.use(cors(corsOptions));
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
  const user = socket.data.user;
  if (user?.employeeId) {
    socket.join(String(user.employeeId));
    if (user.department) socket.join(`department:${String(user.department).toLowerCase()}`);
    const room = teamRoom(user.team);
    if (room) socket.join(room);
    logger.info(`👤 Authenticated notification channel joined for ${user.employeeId}`);
  }

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
