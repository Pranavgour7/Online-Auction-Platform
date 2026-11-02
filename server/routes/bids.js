const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');

// @route   POST api/bids
// @desc    Place a new bid
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { auction, amount } = req.body;
    const bidAmount = parseFloat(amount);

    if (!auction || isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ message: 'Valid auction ID and bid amount are required' });
    }

    // Check if auction exists
    const auctionData = await Auction.findById(auction);
    if (!auctionData) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Update auction status to make sure it's current
    const { changed } = auctionData.updateStatus();
    if (changed) {
      await auctionData.save();
    }

    if (auctionData.status !== 'active') {
      return res.status(400).json({ 
        message: `Cannot place bid on an auction with status: ${auctionData.status}` 
      });
    }

    // Check if user is the auction creator (seller cannot bid on own auction)
    if (auctionData.createdBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot bid on your own auction' });
    }

    // Check if bid meets minimum increment requirements
    const minRequiredBid = auctionData.totalBids === 0
      ? auctionData.startingBid
      : auctionData.currentBid + auctionData.minBidIncrement;

    if (bidAmount < minRequiredBid) {
      return res.status(400).json({ 
        message: `Bid must be at least $${minRequiredBid.toFixed(2)}` 
      });
    }

    // Create new bid
    const bid = new Bid({
      auction,
      bidder: req.user.id,
      amount: bidAmount,
      status: 'active'
    });

    await bid.save();

    // Mark previous active bids for this auction as outbid
    await Bid.updateMany(
      { auction, status: 'active', _id: { $ne: bid._id } },
      { status: 'outbid' }
    );

    // Update auction with new highest bid and increment totalBids
    auctionData.currentBid = bidAmount;
    auctionData.currentHighestBidder = req.user.id;
    auctionData.totalBids = (auctionData.totalBids || 0) + 1;
    await auctionData.save();

    // Populate bidder info for response & socket
    const populatedBid = await Bid.findById(bid._id)
      .populate('bidder', 'username email');

    // Get updated auction with all populated fields
    const updatedAuction = await Auction.findById(auction)
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username email');

    // Real-time notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Room-specific notifications
      io.to(auction).emit('bidPlaced', populatedBid);
      io.to(auction).emit('auctionUpdated', updatedAuction);
      // Global update so listings and home page reflect the current bid in real time
      io.emit('auctionStatusChanged', updatedAuction);
    }

    res.status(201).json({
      bid: populatedBid,
      auction: updatedAuction
    });
  } catch (error) {
    console.error('Error placing bid:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/bids/auction/:auctionId
// @desc    Get all bids for a specific auction
// @access  Public
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .sort({ amount: -1, timestamp: -1 })
      .populate('bidder', 'username email');
    res.json(bids);
  } catch (error) {
    console.error('Error fetching auction bids:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/bids/user/me
// @desc    Get all bids made by current user
// @access  Private
router.get('/user/me', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.id })
      .sort({ timestamp: -1 })
      .populate({
        path: 'auction',
        populate: {
          path: 'product',
          select: 'name images category condition'
        }
      });
    res.json(bids);
  } catch (error) {
    console.error('Error fetching user bids:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/bids/active
// @desc    Get all active bids by current user
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ 
      bidder: req.user.id,
      status: 'active'
    })
      .sort({ timestamp: -1 })
      .populate({
        path: 'auction',
        populate: {
          path: 'product',
          select: 'name images category'
        }
      });
    res.json(bids);
  } catch (error) {
    console.error('Error fetching active bids:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/bids/won
// @desc    Get all auctions won by current user
// @access  Private
router.get('/won', auth, async (req, res) => {
  try {
    await Auction.updateAllStatuses();

    const wonAuctions = await Auction.find({
      status: 'completed',
      currentHighestBidder: req.user.id
    })
      .populate('product')
      .populate('createdBy', 'username email');
    
    res.json(wonAuctions);
  } catch (error) {
    console.error('Error fetching won auctions:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
