const { describe, it } = require('node:test');
const assert = require('node:assert');
const Auction = require('../models/Auction');
const Product = require('../models/Product');
const User = require('../models/User');
const Bid = require('../models/Bid');

describe('Data Models & Auction Lifecycle Logic', () => {
  it('instantiates User model and validates required fields', () => {
    const user = new User({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'mypassword123'
    });

    const error = user.validateSync();
    assert.strictEqual(error, undefined);
    assert.strictEqual(user.username, 'john_doe');
    assert.strictEqual(user.role, 'user');
  });

  it('fails validation when User email or password is missing', () => {
    const user = new User({ username: 'missing_fields' });
    const error = user.validateSync();
    assert.ok(error.errors['email']);
    assert.ok(error.errors['password']);
  });

  it('instantiates Product model with valid attributes', () => {
    const fakeSellerId = '507f191e810c19729de860ea';
    const product = new Product({
      name: 'Mechanical Watch',
      description: 'Swiss movement stainless steel watch',
      category: 'Jewelry',
      condition: 'New',
      seller: fakeSellerId,
      startingPrice: 500
    });

    const error = product.validateSync();
    assert.strictEqual(error, undefined);
    assert.strictEqual(product.startingPrice, 500);
    assert.strictEqual(product.condition, 'New');
  });

  it('correctly transitions Auction status based on timing', () => {
    const now = Date.now();
    const fakeProductId = '507f191e810c19729de860ea';
    const fakeUserId = '507f191e810c19729de860eb';

    // 1. Upcoming auction (future start time)
    const upcomingAuction = new Auction({
      product: fakeProductId,
      createdBy: fakeUserId,
      startTime: new Date(now + 100000),
      endTime: new Date(now + 200000),
      startingBid: 100,
      status: 'pending'
    });
    const result1 = upcomingAuction.updateStatus();
    assert.strictEqual(upcomingAuction.status, 'pending');

    // 2. Active auction (start time is past, end time is future)
    const activeAuction = new Auction({
      product: fakeProductId,
      createdBy: fakeUserId,
      startTime: new Date(now - 100000),
      endTime: new Date(now + 100000),
      startingBid: 100,
      status: 'pending'
    });
    const result2 = activeAuction.updateStatus();
    assert.strictEqual(activeAuction.status, 'active');
    assert.strictEqual(result2.changed, true);

    // 3. Completed auction (end time is past)
    const completedAuction = new Auction({
      product: fakeProductId,
      createdBy: fakeUserId,
      startTime: new Date(now - 200000),
      endTime: new Date(now - 100000),
      startingBid: 100,
      status: 'active'
    });
    const result3 = completedAuction.updateStatus();
    assert.strictEqual(completedAuction.status, 'completed');
    assert.strictEqual(result3.changed, true);
  });

  it('validates Bid schema amount and status constraints', () => {
    const fakeAuctionId = '507f191e810c19729de860ea';
    const fakeBidderId = '507f191e810c19729de860eb';

    const bid = new Bid({
      auction: fakeAuctionId,
      bidder: fakeBidderId,
      amount: 250,
      status: 'active'
    });

    const error = bid.validateSync();
    assert.strictEqual(error, undefined);
    assert.strictEqual(bid.amount, 250);
    assert.strictEqual(bid.status, 'active');
  });
});

