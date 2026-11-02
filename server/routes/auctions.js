const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Auction = require('../models/Auction');
const Product = require('../models/Product');

// @route   POST api/auctions
// @desc    Create a new auction
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { product, startTime, endTime, startingBid, minBidIncrement } = req.body;

    // Validate required fields
    if (!product || !startTime || !endTime || startingBid === undefined) {
      return res.status(400).json({ message: 'Missing required auction fields' });
    }

    // Check if product exists and belongs to user
    const productData = await Product.findById(product);
    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (productData.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to create an auction for this product' });
    }

    // Check if product already has an active auction
    const existingAuction = await Auction.findOne({
      product,
      status: { $in: ['pending', 'active'] }
    });

    if (existingAuction) {
      return res.status(400).json({ message: 'This product already has an active or scheduled auction' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Determine initial status based on start time
    const now = new Date();
    let initialStatus = 'pending';
    if (start <= now && end > now) {
      initialStatus = 'active';
    }

    const auction = new Auction({
      product,
      startTime: start,
      endTime: end,
      startingBid: parseFloat(startingBid),
      currentBid: parseFloat(startingBid),
      minBidIncrement: parseFloat(minBidIncrement || 1),
      status: initialStatus,
      createdBy: req.user.id
    });

    await auction.save();
    
    // Populate related data before sending response
    const populatedAuction = await Auction.findById(auction._id)
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username email');

    // Broadcast the new auction to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('newAuction', populatedAuction);
    }

    res.status(201).json(populatedAuction);
  } catch (error) {
    console.error('Error creating auction:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/auctions
// @desc    Get all auctions with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skipIndex = (page - 1) * limit;
    
    let query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.seller) {
      query.createdBy = req.query.seller;
    }

    // First update any statuses that expired or need activation
    await Auction.updateAllStatuses();
    
    let auctions = await Auction.find(query)
      .sort({ createdAt: -1 })
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username');

    // Filter by category or search on populated product if requested
    if (req.query.category) {
      auctions = auctions.filter(a => a.product && a.product.category === req.query.category);
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      auctions = auctions.filter(a => a.product && (searchRegex.test(a.product.name) || searchRegex.test(a.product.description)));
    }

    const total = auctions.length;
    const paginatedAuctions = auctions.slice(skipIndex, skipIndex + limit);
    
    res.json({
      auctions: paginatedAuctions,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching auctions:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/auctions/active
// @desc    Get all active auctions
// @access  Public
router.get('/active', async (req, res) => {
  try {
    await Auction.updateAllStatuses();

    const auctions = await Auction.find({ status: 'active' })
      .sort({ endTime: 1 })
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username');
    
    res.json(auctions);
  } catch (error) {
    console.error('Error fetching active auctions:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/auctions/user/me
// @desc    Get all auctions created by current user
// @access  Private
router.get('/user/me', auth, async (req, res) => {
  try {
    await Auction.updateAllStatuses();

    const auctions = await Auction.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('product')
      .populate('currentHighestBidder', 'username email');
    
    res.json(auctions);
  } catch (error) {
    console.error('Error fetching user auctions:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/auctions/:id
// @desc    Get auction by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username email');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Update auction status based on current time
    const { changed } = auction.updateStatus();
    if (changed) {
      await auction.save();
    }
    
    // Increment view count
    auction.views = (auction.views || 0) + 1;
    await auction.save();

    res.json(auction);
  } catch (error) {
    console.error('Error fetching auction by ID:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT api/auctions/:id
// @desc    Update auction details (only if status is pending)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { startTime, endTime, startingBid, minBidIncrement } = req.body;
    
    let auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (auction.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    if (auction.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update an auction that has already started or completed' });
    }
    
    if (startTime) auction.startTime = new Date(startTime);
    if (endTime) auction.endTime = new Date(endTime);
    if (startingBid !== undefined) {
      auction.startingBid = parseFloat(startingBid);
      auction.currentBid = parseFloat(startingBid);
    }
    if (minBidIncrement !== undefined) {
      auction.minBidIncrement = parseFloat(minBidIncrement);
    }
    
    auction.updateStatus();
    await auction.save();
    
    const updated = await Auction.findById(auction._id)
      .populate('product')
      .populate('createdBy', 'username email');

    res.json(updated);
  } catch (error) {
    console.error('Error updating auction:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE api/auctions/:id
// @desc    Cancel an auction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (auction.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    if (auction.status === 'active' && auction.totalBids > 0) {
      return res.status(400).json({ message: 'Cannot cancel an active auction that has active bids' });
    }
    
    if (auction.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed auction' });
    }
    
    auction.status = 'cancelled';
    await auction.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('auctionStatusChanged', auction);
    }

    res.json({ message: 'Auction cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling auction:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
