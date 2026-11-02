const { describe, it } = require('node:test');
const assert = require('node:assert');

// 1. API and Image URL formatting logic tests
describe('Client Configuration & URL Normalization', () => {
  const normalizeApiUrl = (raw, isProd = false) => {
    if (!raw && !isProd) return 'http://localhost:5000';
    if (!raw && isProd) return '';
    return raw.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  };

  const formatImageUrl = (imagePath, baseUrl = 'http://localhost:5000') => {
    if (!imagePath) {
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  };

  it('correctly normalizes API URLs and strips duplicate /api and trailing slashes', () => {
    assert.strictEqual(normalizeApiUrl('http://localhost:5000/api'), 'http://localhost:5000');
    assert.strictEqual(normalizeApiUrl('http://localhost:5000/api/'), 'http://localhost:5000');
    assert.strictEqual(normalizeApiUrl('http://localhost:5000/'), 'http://localhost:5000');
    assert.strictEqual(normalizeApiUrl('http://localhost:5000'), 'http://localhost:5000');
    assert.strictEqual(normalizeApiUrl('https://auction-backend.onrender.com/api/'), 'https://auction-backend.onrender.com');
  });

  it('safely formats image URLs with fallbacks, absolute URLs, and relative uploads', () => {
    assert.strictEqual(
      formatImageUrl(null),
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
    );
    assert.strictEqual(
      formatImageUrl('https://example.com/item.jpg'),
      'https://example.com/item.jpg'
    );
    assert.strictEqual(
      formatImageUrl('uploads/lot-123.jpg', 'http://localhost:5000'),
      'http://localhost:5000/uploads/lot-123.jpg'
    );
    assert.strictEqual(
      formatImageUrl('/uploads/lot-123.jpg', 'http://localhost:5000'),
      'http://localhost:5000/uploads/lot-123.jpg'
    );
  });
});

// 2. Bidding Engine & Minimum Step Rules
describe('Bidding Validation & Step Calculations', () => {
  const calculateNextMinimumBid = (auction) => {
    if (auction.totalBids === 0 || !auction.currentHighestBidder) {
      return auction.startingBid;
    }
    return auction.currentBid + auction.minBidIncrement;
  };

  const validateBidPlacement = (auction, bidderId, bidAmount) => {
    if (auction.status !== 'active') {
      return { valid: false, error: 'Cannot place bid on inactive auction' };
    }
    if (auction.createdBy === bidderId) {
      return { valid: false, error: 'You cannot bid on your own auction' };
    }
    const minRequired = calculateNextMinimumBid(auction);
    if (isNaN(bidAmount) || bidAmount < minRequired) {
      return { valid: false, error: `Minimum required bid is $${minRequired.toFixed(2)}` };
    }
    return { valid: true };
  };

  it('calculates the exact opening bid when no bids have been placed', () => {
    const freshAuction = {
      startingBid: 150,
      currentBid: 150,
      minBidIncrement: 10,
      totalBids: 0,
      currentHighestBidder: null
    };
    assert.strictEqual(calculateNextMinimumBid(freshAuction), 150);
  });

  it('calculates incremented next bid once active bids exist', () => {
    const activeAuction = {
      startingBid: 100,
      currentBid: 250,
      minBidIncrement: 25,
      totalBids: 3,
      currentHighestBidder: 'user_123'
    };
    assert.strictEqual(calculateNextMinimumBid(activeAuction), 275);
  });

  it('rejects bids when bidder is auction creator or bid is below minimum', () => {
    const auction = {
      status: 'active',
      createdBy: 'seller_1',
      startingBid: 50,
      currentBid: 100,
      minBidIncrement: 10,
      totalBids: 2,
      currentHighestBidder: 'bidder_other'
    };

    const selfBid = validateBidPlacement(auction, 'seller_1', 150);
    assert.strictEqual(selfBid.valid, false);
    assert.match(selfBid.error, /cannot bid on your own/i);

    const underBid = validateBidPlacement(auction, 'bidder_2', 105);
    assert.strictEqual(underBid.valid, false);
    assert.match(underBid.error, /minimum required bid is \$110/i);

    const validBid = validateBidPlacement(auction, 'bidder_2', 110);
    assert.strictEqual(validBid.valid, true);
  });
});

// 3. Auction Countdown & Time Formatting
describe('Auction Countdown Formatter', () => {
  const formatCountdown = (endTimeStr, now = new Date()) => {
    const endTime = new Date(endTimeStr);
    const diff = endTime - now;
    if (diff <= 0) return 'Auction Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  it('correctly reports Auction Ended for past end dates', () => {
    const past = new Date(Date.now() - 5000).toISOString();
    assert.strictEqual(formatCountdown(past), 'Auction Ended');
  });

  it('formats remaining time into readable countdown segments', () => {
    const now = new Date('2026-11-03T00:00:00Z');
    const future = new Date('2026-11-04T02:15:30Z'); // 1d 2h 15m 30s
    assert.strictEqual(formatCountdown(future.toISOString(), now), '1d 2h 15m 30s');
  });
});

