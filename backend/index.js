const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL || "*"], // Allow env var or wildcard
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/execute', require('./routes/execution'));
app.use('/api/assessments', require('./routes/assessment'));
app.use('/api/invitations', require('./routes/invitation'));
app.use('/api/interviews', require('./routes/interview'));
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5001;

// Basic route
app.get('/', (req, res) => {
  res.send('AI Interviewer Backend Running');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB Connection
const connectDB = require('./config/db');
connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
