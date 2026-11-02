const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_auction_hub_2026_dev';

const now = Date.now();

const sampleUsers = [
  {
    _id: '67a1b2c3d4e5f6a7b8c90001',
    id: '67a1b2c3d4e5f6a7b8c90001',
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
    _id: '67a1b2c3d4e5f6a7b8c90002',
    id: '67a1b2c3d4e5f6a7b8c90002',
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
    _id: '67a1b2c3d4e5f6a7b8c90003',
    id: '67a1b2c3d4e5f6a7b8c90003',
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
    _id: '67a1b2c3d4e5f6a7b8c90004',
    id: '67a1b2c3d4e5f6a7b8c90004',
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
    _id: '67a1b2c3d4e5f6a7b8c91001',
    id: '67a1b2c3d4e5f6a7b8c91001',
    name: 'Vintage 1968 Omega Speedmaster Professional',
    description: 'Authentic 1968 Omega Speedmaster chronograph with original step dial, dot-over-90 bezel, and cal. 861 movement. Recently inspected by a certified horologist. Keeps time flawlessly.',
    category: 'Jewelry',
    condition: 'Good',
    startingPrice: 3200,
    seller: '67a1b2c3d4e5f6a7b8c90001',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547996160-71dfabb1d5b3?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c91002',
    id: '67a1b2c3d4e5f6a7b8c91002',
    name: 'Leica M6 35mm Rangefinder Camera (Classic 0.72x)',
    description: 'Iconic black chrome Leica M6 0.72x viewfinder in excellent working condition. Clean shutter curtains, bright rangefinder patch, and accurate light meter. Includes body cap and original strap.',
    category: 'Collectibles',
    condition: 'Like New',
    startingPrice: 1850,
    seller: '67a1b2c3d4e5f6a7b8c90002',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c91003',
    id: '67a1b2c3d4e5f6a7b8c91003',
    name: 'Apple MacBook Pro 16" M3 Max (36GB RAM, 1TB SSD)',
    description: 'Space Black MacBook Pro 16-inch featuring the revolutionary M3 Max chip with 14-core CPU and 30-core GPU. Liquid Retina XDR display. Battery health 99%, flawless condition with original box and 140W MagSafe charger.',
    category: 'Electronics',
    condition: 'Like New',
    startingPrice: 2100,
    seller: '67a1b2c3d4e5f6a7b8c90001',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c91004',
    id: '67a1b2c3d4e5f6a7b8c91004',
    name: 'Air Jordan 1 Retro High OG "Chicago" 1985 Collector Pair',
    description: 'Museum-grade collector piece: 1985 Original Air Jordan 1 Chicago colorway. Size US 10.5. Preserved in UV-protected acrylic showcase. Includes certificate of authenticity and provenance history.',
    category: 'Fashion',
    condition: 'Good',
    startingPrice: 4500,
    seller: '67a1b2c3d4e5f6a7b8c90002',
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c91005',
    id: '67a1b2c3d4e5f6a7b8c91005',
    name: 'Fender Custom Shop 1960 Stratocaster Relic (Olympic White)',
    description: 'Masterbuilt hand-wound pickups, alder body, quarter-sawn maple neck with 60s oval "C" profile and AAA rosewood fretboard. Comes with deluxe hardshell case and Custom Shop COA.',
    category: 'Other',
    condition: 'New',
    startingPrice: 2800,
    seller: '67a1b2c3d4e5f6a7b8c90001',
    images: [
      'https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c91006',
    id: '67a1b2c3d4e5f6a7b8c91006',
    name: 'Sony PlayStation 5 Pro Console (2TB Edition, Sealed)',
    description: 'Brand new, factory-sealed Sony PS5 Pro gaming console. 2TB high-speed NVMe storage, advanced ray tracing architecture, and 4K 120Hz support. Includes DualSense wireless controller and warranty.',
    category: 'Electronics',
    condition: 'New',
    startingPrice: 650,
    seller: '67a1b2c3d4e5f6a7b8c90002',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

let sampleAuctions = [
  {
    _id: '67a1b2c3d4e5f6a7b8c92001',
    id: '67a1b2c3d4e5f6a7b8c92001',
    product: sampleProducts[0],
    startTime: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
    startingBid: 3200,
    currentBid: 3500,
    minBidIncrement: 50,
    status: 'active',
    totalBids: 3,
    currentHighestBidder: { _id: sampleUsers[2]._id, username: sampleUsers[2].username, email: sampleUsers[2].email },
    createdBy: { _id: sampleUsers[0]._id, username: sampleUsers[0].username, email: sampleUsers[0].email },
    views: 142
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c92002',
    id: '67a1b2c3d4e5f6a7b8c92002',
    product: sampleProducts[1],
    startTime: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
    startingBid: 1850,
    currentBid: 2100,
    minBidIncrement: 25,
    status: 'active',
    totalBids: 4,
    currentHighestBidder: { _id: sampleUsers[3]._id, username: sampleUsers[3].username, email: sampleUsers[3].email },
    createdBy: { _id: sampleUsers[1]._id, username: sampleUsers[1].username, email: sampleUsers[1].email },
    views: 98
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c92003',
    id: '67a1b2c3d4e5f6a7b8c92003',
    product: sampleProducts[2],
    startTime: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now + 72 * 60 * 60 * 1000).toISOString(),
    startingBid: 2100,
    currentBid: 2350,
    minBidIncrement: 50,
    status: 'active',
    totalBids: 2,
    currentHighestBidder: { _id: sampleUsers[2]._id, username: sampleUsers[2].username, email: sampleUsers[2].email },
    createdBy: { _id: sampleUsers[0]._id, username: sampleUsers[0].username, email: sampleUsers[0].email },
    views: 215
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c92004',
    id: '67a1b2c3d4e5f6a7b8c92004',
    product: sampleProducts[3],
    startTime: new Date(now - 30 * 60 * 1000).toISOString(),
    endTime: new Date(now + 36 * 60 * 60 * 1000).toISOString(),
    startingBid: 4500,
    currentBid: 4800,
    minBidIncrement: 100,
    status: 'active',
    totalBids: 2,
    currentHighestBidder: { _id: sampleUsers[3]._id, username: sampleUsers[3].username, email: sampleUsers[3].email },
    createdBy: { _id: sampleUsers[1]._id, username: sampleUsers[1].username, email: sampleUsers[1].email },
    views: 340
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c92005',
    id: '67a1b2c3d4e5f6a7b8c92005',
    product: sampleProducts[4],
    startTime: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now + 120 * 60 * 60 * 1000).toISOString(),
    startingBid: 2800,
    currentBid: 2800,
    minBidIncrement: 50,
    status: 'pending',
    totalBids: 0,
    currentHighestBidder: null,
    createdBy: { _id: sampleUsers[0]._id, username: sampleUsers[0].username, email: sampleUsers[0].email },
    views: 45
  },
  {
    _id: '67a1b2c3d4e5f6a7b8c92006',
    id: '67a1b2c3d4e5f6a7b8c92006',
    product: sampleProducts[5],
    startTime: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now + 18 * 60 * 60 * 1000).toISOString(),
    startingBid: 650,
    currentBid: 780,
    minBidIncrement: 10,
    status: 'active',
    totalBids: 5,
    currentHighestBidder: { _id: sampleUsers[2]._id, username: sampleUsers[2].username, email: sampleUsers[2].email },
    createdBy: { _id: sampleUsers[1]._id, username: sampleUsers[1].username, email: sampleUsers[1].email },
    views: 189
  }
];

let sampleBids = [
  {
    _id: '67a1b2c3d4e5f6a7b8c93001',
    auction: '67a1b2c3d4e5f6a7b8c92001',
    bidder: sampleUsers[2],
    amount: 3500,
    timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    status: 'winning'
  }
];

// Helper methods for Demo Store
const findUserByEmailOrUsername = (identifier) => {
  const clean = (identifier || '').trim().toLowerCase();
  return sampleUsers.find(u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean);
};

const findUserById = (id) => {
  return sampleUsers.find(u => u._id === id || u.id === id);
};

const createToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (authHeader) => {
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return findUserById(decoded.id);
  } catch (e) {
    return null;
  }
};

module.exports = {
  sampleUsers,
  sampleProducts,
  sampleAuctions,
  sampleBids,
  findUserByEmailOrUsername,
  findUserById,
  createToken,
  verifyToken
};
