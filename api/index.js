const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const demoStore = require('./demoStore');

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cached connection promise
let connectPromise = null;

const tryConnectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (!process.env.MONGODB_URI) {
    return false;
  }
  if (!connectPromise) {
    connectPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
      bufferCommands: false
    }).then(() => {
      console.log('✅ Connected to MongoDB Atlas live cluster');
      return true;
    }).catch(err => {
      console.warn('⚠️ Atlas connection failed (IP Whitelist), utilizing resilient Demo Store:', err.message);
      connectPromise = null;
      return false;
    });
  }
  return connectPromise;
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const isConnected = await tryConnectDB();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'atlas_connected' : 'demo_fallback_active',
    atlasIpNote: isConnected 
      ? 'MongoDB Atlas is connected and active!' 
      : 'Using resilient fallback store. To enable Atlas directly from Vercel, whitelist 0.0.0.0/0 in MongoDB Atlas Network Access.'
  });
});

// Middleware to try connecting on every request
app.use(async (req, res, next) => {
  try {
    await tryConnectDB();
  } catch (e) {
    // continue
  }
  next();
});

// Import normal server routes
const userRoutes = require('../server/routes/users');
const productRoutes = require('../server/routes/products');
const auctionRoutes = require('../server/routes/auctions');
const bidRoutes = require('../server/routes/bids');
const uploadsRoutes = require('../server/routes/uploads');

// When DB is NOT connected (e.g. Atlas IP Whitelist blocks Vercel IPs), provide seamless fallback
app.post('/api/users/login', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return userRoutes(req, res, next);
  }
  const { email, password } = req.body;
  const user = demoStore.findUserByEmailOrUsername(email);
  if (!user || user.password !== password) {
    return res.status(400).json({ 
      message: 'Invalid credentials. Use demo@auction.com / password123 or admin@auction.com / password123' 
    });
  }
  const token = demoStore.createToken(user._id);
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address
    }
  });
});

app.get('/api/users/profile', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return userRoutes(req, res, next);
  }
  const user = demoStore.verifyToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  res.json({
    _id: user._id,
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    address: user.address
  });
});

app.get('/api/auctions', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return auctionRoutes(req, res, next);
  }
  let list = [...demoStore.sampleAuctions];
  if (req.query.status) {
    list = list.filter(a => a.status === req.query.status);
  }
  if (req.query.category) {
    list = list.filter(a => a.product && a.product.category === req.query.category);
  }
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    list = list.filter(a => a.product && (a.product.name.toLowerCase().includes(s) || a.product.description.toLowerCase().includes(s)));
  }
  res.json(list);
});

app.get('/api/auctions/:id', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return auctionRoutes(req, res, next);
  }
  const auction = demoStore.sampleAuctions.find(a => a._id === req.params.id || a.id === req.params.id);
  if (!auction) {
    return res.status(404).json({ message: 'Auction not found' });
  }
  res.json(auction);
});

app.get('/api/products', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return productRoutes(req, res, next);
  }
  res.json({
    products: demoStore.sampleProducts,
    total: demoStore.sampleProducts.length,
    page: 1,
    pages: 1
  });
});

app.get('/api/products/:id', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return productRoutes(req, res, next);
  }
  const product = demoStore.sampleProducts.find(p => p._id === req.params.id || p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

app.post('/api/bids', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return bidRoutes(req, res, next);
  }
  const user = demoStore.verifyToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ message: 'Please login to place bids' });
  }
  const { auction: auctionId, amount } = req.body;
  const auction = demoStore.sampleAuctions.find(a => a._id === auctionId || a.id === auctionId);
  if (!auction) {
    return res.status(404).json({ message: 'Auction not found' });
  }
  const numAmount = parseFloat(amount);
  if (numAmount <= auction.currentBid) {
    return res.status(400).json({ message: `Bid must be greater than current bid ($${auction.currentBid})` });
  }
  auction.currentBid = numAmount;
  auction.totalBids = (auction.totalBids || 0) + 1;
  auction.currentHighestBidder = { _id: user._id, username: user.username, email: user.email };
  const newBid = {
    _id: 'bid_' + Date.now(),
    auction: auction._id,
    bidder: user,
    amount: numAmount,
    timestamp: new Date().toISOString(),
    status: 'winning'
  };
  demoStore.sampleBids.unshift(newBid);
  res.status(201).json({ bid: newBid, auction });
});

app.get('/api/bids/auction/:auctionId', async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return bidRoutes(req, res, next);
  }
  const bids = demoStore.sampleBids.filter(b => b.auction === req.params.auctionId);
  res.json(bids);
});

// Delegate to real router when DB is connected
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/uploads', uploadsRoutes);

module.exports = app;
