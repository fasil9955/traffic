// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/apiRoutes');
const { checkProximity } = require('./controllers/TrafficLightController'); 

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());

// Use combined API routes
app.use('/', apiRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

// Listen for live location updates from the frontend
socket.on('liveLocation', async (location) => {
    console.log('Live location received:', location);
    await checkProximity(location, io);
  });

  

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});  