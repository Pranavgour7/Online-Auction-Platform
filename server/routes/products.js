const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Product = require('../models/Product');
const Auction = require('../models/Auction');

// @route   POST api/products
// @desc    Create a new product
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, images, condition, startingPrice } = req.body;

    if (!name || !description || !category || !condition || startingPrice === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create new product
    const product = new Product({
      name,
      description,
      category,
      images: images || [],
      condition,
      seller: req.user.id,
      startingPrice: parseFloat(startingPrice)
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/products
// @desc    Get all products with pagination and filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    
    let query = {};
    
    // Add filters if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.condition) {
      query.condition = req.query.condition;
    }
    
    if (req.query.seller) {
      query.seller = req.query.seller;
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
      .populate('seller', 'username email');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/products/user/me
// @desc    Get all products by current user
// @access  Private
router.get('/user/me', auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'username email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, category, images, condition, startingPrice } = req.body;
    
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the seller or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (images) product.images = images;
    if (condition) product.condition = condition;
    if (startingPrice !== undefined) product.startingPrice = parseFloat(startingPrice);
    
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the seller or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Check if product has an active auction
    const activeAuction = await Auction.findOne({
      product: req.params.id,
      status: { $in: ['active', 'pending'] }
    });

    if (activeAuction) {
      return res.status(400).json({ 
        message: 'Cannot delete product with an active or scheduled auction. Cancel the auction first.' 
      });
    }
    
    // Mongoose 8 fix: use deleteOne instead of deprecated .remove()
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
