const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auction-platform';

const sampleUsers = [
  {
    username: 'demo_user',
    email: 'demo@auction.com',
    password: 'password123',
    firstName: 'Demo',
    lastName: 'User',
    phoneNumber: '+1-555-0199',
    address: { street: '123 Market St', city: 'San Francisco', state: 'CA', zip: '94105', country: 'USA' },
    role: 'user'
  },
  {
    username: 'admin',
    email: 'admin@auction.com',
    password: 'password123',
    firstName: 'Platform',
    lastName: 'Admin',
    phoneNumber: '+1-555-0100',
    address: { street: '100 Tech Blvd', city: 'Seattle', state: 'WA', zip: '98101', country: 'USA' },
    role: 'admin'
  },
  {
    username: 'sarah_collector',
    email: 'sarah@example.com',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    phoneNumber: '+1-555-0144',
    address: { street: '456 Vintage Way', city: 'New York', state: 'NY', zip: '10001', country: 'USA' },
    role: 'user'
  },
  {
    username: 'alex_tech',
    email: 'alex@example.com',
    password: 'password123',
    firstName: 'Alex',
    lastName: 'Rivera',
    phoneNumber: '+1-555-0177',
    address: { street: '789 Innovation Ave', city: 'Austin', state: 'TX', zip: '78701', country: 'USA' },
    role: 'user'
  }
];

const sampleProducts = [
  {
    name: 'Vintage 1968 Omega Speedmaster Professional',
    description: 'Authentic 1968 Omega Speedmaster chronograph with original step dial, dot-over-90 bezel, and cal. 861 movement. Recently inspected by a certified horologist. Keeps time flawlessly.',
    category: 'Jewelry',
    condition: 'Good',
    startingPrice: 3200,
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547996160-71dfabb1d5b3?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Leica M6 35mm Rangefinder Camera (Classic 0.72x)',
    description: 'Iconic black chrome Leica M6 0.72x viewfinder in excellent working condition. Clean shutter curtains, bright rangefinder patch, and accurate light meter. Includes body cap and original strap.',
    category: 'Collectibles',
    condition: 'Like New',
    startingPrice: 1850,
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Apple MacBook Pro 16" M3 Max (36GB RAM, 1TB SSD)',
    description: 'Space Black MacBook Pro 16-inch featuring the revolutionary M3 Max chip with 14-core CPU and 30-core GPU. Liquid Retina XDR display. Battery health 99%, flawless condition with original box and 140W MagSafe charger.',
    category: 'Electronics',
    condition: 'Like New',
    startingPrice: 2100,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Air Jordan 1 Retro High OG "Chicago" 1985 Collector Pair',
    description: 'Museum-grade collector piece: 1985 Original Air Jordan 1 Chicago colorway. Size US 10.5. Preserved in UV-protected acrylic showcase. Includes certificate of authenticity and provenance history.',
    category: 'Fashion',
    condition: 'Good',
    startingPrice: 4500,
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Fender Custom Shop 1960 Stratocaster Relic (Olympic White)',
    description: 'Masterbuilt hand-wound pickups, alder body, quarter-sawn maple neck with 60s oval "C" profile and AAA rosewood fretboard. Comes with deluxe hardshell case and Custom Shop COA.',
    category: 'Other',
    condition: 'New',
    startingPrice: 2800,
    images: [
      'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Sony PlayStation 5 Pro Console (2TB Edition, Sealed)',
    description: 'Brand new, factory-sealed Sony PS5 Pro gaming console. 2TB high-speed NVMe storage, advanced ray tracing architecture, and 4K 120Hz support. Includes DualSense wireless controller and warranty.',
    category: 'Electronics',
    condition: 'New',
    startingPrice: 650,
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
    console.log('Clearing existing collections...');
    
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Auction.deleteMany({}),
      Bid.deleteMany({})
    ]);

    console.log('Seeding Users...');
    const createdUsers = [];
    for (const u of sampleUsers) {
      const newUser = new User(u);
      await newUser.save();
      createdUsers.push(newUser);
    }
    console.log(`Created ${createdUsers.length} users`);

    const sellerUser = createdUsers[0]; // demo_user
    const bidderUser1 = createdUsers[2]; // sarah_collector
    const bidderUser2 = createdUsers[3]; // alex_tech

    console.log('Seeding Products...');
    const createdProducts = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      const prodData = {
        ...sampleProducts[i],
        seller: (i % 2 === 0) ? sellerUser._id : createdUsers[1]._id
      };
      const product = new Product(prodData);
      await product.save();
      createdProducts.push(product);
    }
    console.log(`Created ${createdProducts.length} products`);

    console.log('Seeding Auctions & Real Bids...');
    const now = Date.now();

    // 1. Live Active Auction 1 (Ending in 2 days)
    const auction1 = new Auction({
      product: createdProducts[0]._id,
      startTime: new Date(now - 12 * 60 * 60 * 1000),
      endTime: new Date(now + 48 * 60 * 60 * 1000),
      startingBid: 3200,
      currentBid: 3500,
      minBidIncrement: 50,
      status: 'active',
      totalBids: 3,
      currentHighestBidder: bidderUser1._id,
      createdBy: sellerUser._id,
      views: 142
    });
    await auction1.save();

    const bid1_1 = new Bid({
      auction: auction1._id,
      bidder: bidderUser2._id,
      amount: 3250,
      timestamp: new Date(now - 10 * 60 * 60 * 1000),
      status: 'outbid'
    });
    await bid1_1.save();

    const bid1_2 = new Bid({
      auction: auction1._id,
      bidder: bidderUser1._id,
      amount: 3350,
      timestamp: new Date(now - 5 * 60 * 60 * 1000),
      status: 'outbid'
    });
    await bid1_2.save();

    const bid1_3 = new Bid({
      auction: auction1._id,
      bidder: bidderUser1._id,
      amount: 3500,
      timestamp: new Date(now - 1 * 60 * 60 * 1000),
      status: 'active'
    });
    await bid1_3.save();

    // 2. Live Active Auction 2 (Ending in 5 hours)
    const auction2 = new Auction({
      product: createdProducts[1]._id,
      startTime: new Date(now - 36 * 60 * 60 * 1000),
      endTime: new Date(now + 5 * 60 * 60 * 1000),
      startingBid: 1850,
      currentBid: 2150,
      minBidIncrement: 25,
      status: 'active',
      totalBids: 4,
      currentHighestBidder: bidderUser2._id,
      createdBy: sellerUser._id,
      views: 289
    });
    await auction2.save();

    const bid2_1 = new Bid({
      auction: auction2._id,
      bidder: bidderUser1._id,
      amount: 1900,
      timestamp: new Date(now - 20 * 60 * 60 * 1000),
      status: 'outbid'
    });
    await bid2_1.save();

    const bid2_2 = new Bid({
      auction: auction2._id,
      bidder: bidderUser2._id,
      amount: 2150,
      timestamp: new Date(now - 2 * 60 * 60 * 1000),
      status: 'active'
    });
    await bid2_2.save();

    // 3. Live Active Auction 3 (MacBook Pro)
    const auction3 = new Auction({
      product: createdProducts[2]._id,
      startTime: new Date(now - 6 * 60 * 60 * 1000),
      endTime: new Date(now + 72 * 60 * 60 * 1000),
      startingBid: 2100,
      currentBid: 2200,
      minBidIncrement: 50,
      status: 'active',
      totalBids: 1,
      currentHighestBidder: bidderUser1._id,
      createdBy: createdUsers[1]._id,
      views: 74
    });
    await auction3.save();

    const bid3_1 = new Bid({
      auction: auction3._id,
      bidder: bidderUser1._id,
      amount: 2200,
      timestamp: new Date(now - 3 * 60 * 60 * 1000),
      status: 'active'
    });
    await bid3_1.save();

    // 4. Upcoming Auction (Sneakers)
    const auction4 = new Auction({
      product: createdProducts[3]._id,
      startTime: new Date(now + 24 * 60 * 60 * 1000),
      endTime: new Date(now + 7 * 24 * 60 * 60 * 1000),
      startingBid: 4500,
      currentBid: 4500,
      minBidIncrement: 100,
      status: 'pending',
      totalBids: 0,
      createdBy: sellerUser._id,
      views: 51
    });
    await auction4.save();

    // 5. Completed Auction (PS5)
    const auction5 = new Auction({
      product: createdProducts[5]._id,
      startTime: new Date(now - 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(now - 1 * 24 * 60 * 60 * 1000),
      startingBid: 650,
      currentBid: 780,
      minBidIncrement: 10,
      status: 'completed',
      totalBids: 5,
      currentHighestBidder: sellerUser._id,
      createdBy: createdUsers[1]._id,
      views: 412
    });
    await auction5.save();

    console.log('✅ Database seeded successfully with vibrant sample data!');
    console.log('----------------------------------------------------');
    console.log('Credentials to present to recruiters:');
    console.log('Demo User:  demo@auction.com  |  Password: password123');
    console.log('Admin User: admin@auction.com |  Password: password123');
    console.log('----------------------------------------------------');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
