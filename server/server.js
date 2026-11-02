const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import models
const Auction = require('./models/Auction');

// Initialize Express & HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching allowedOrigins
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production if client and server are on same domain or custom
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set io instance on app for access in route handlers via req.app.get('io')
app.set('io', io);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Health Check route for deployment monitors
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Mount Routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const uploadsRoutes = require('./routes/uploads');

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/uploads', uploadsRoutes);

// Serve static React build in production
const clientBuildPath = path.join(__dirname, '../client/build');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Development fallback
  app.get('/', (req, res) => {
    res.status(200).send('Auction Platform API is running. Start the React client on port 3000 to view the application.');
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join auction room
  socket.on('joinAuction', (auctionId) => {
    if (auctionId) {
      socket.join(auctionId);
    }
  });
  
  // Leave auction room
  socket.on('leaveAuction', (auctionId) => {
    if (auctionId) {
      socket.leave(auctionId);
    }
  });
  
  // New bid relay
  socket.on('newBid', (bid) => {
    if (bid && bid.auction) {
      io.to(bid.auction).emit('bidPlaced', bid);
    }
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Periodic auction status updater
const updateAuctionStatuses = async () => {
  try {
    const result = await Auction.updateAllStatuses();
    if (result && result.updated > 0) {
      for (const auction of result.auctions) {
        const populatedAuction = await Auction.findById(auction._id)
          .populate('product')
          .populate('createdBy', 'username email')
          .populate('currentHighestBidder', 'username email');
          
        if (populatedAuction) {
          io.emit('auctionStatusChanged', populatedAuction);
        }
      }
    }
  } catch (err) {
    console.error('Error updating auction statuses:', err.message);
  }
};

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auction-platform';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Run auction status update immediately upon connect
    await updateAuctionStatuses();
    
    // Schedule periodic status updates every minute
    setInterval(updateAuctionStatuses, 60000);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

connectDB();

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Auction Platform Server running on port ${PORT}`);
    console.log(`📡 Real-time Socket.io active`);
    console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = { app, server, io };
