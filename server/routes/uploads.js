const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Configure upload limits and file filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only (including webp and svg)
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return cb(new Error('Only image files (jpg, jpeg, png, gif, webp, svg) are allowed!'), false);
    }
    cb(null, true);
  }
});

// @route   POST api/uploads
// @desc    Upload product images
// @access  Private
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }

    // Return relative /uploads/ path for portability across environments
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    
    res.json({ 
      success: true, 
      imageUrls,
      message: `Successfully uploaded ${req.files.length} file(s)`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading files',
      error: error.message 
    });
  }
});

// @route   GET api/uploads/:filename
// @desc    Get uploaded image
// @access  Public
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  // Prevent directory traversal
  const safeFilename = path.basename(filename);
  const filepath = path.join(uploadsDir, safeFilename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'File not found' 
    });
  }
});

// @route   DELETE api/uploads/:filename
// @desc    Delete uploaded image
// @access  Private
router.delete('/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  const safeFilename = path.basename(filename);
  const filepath = path.join(uploadsDir, safeFilename);
  
  if (fs.existsSync(filepath)) {
    try {
      fs.unlinkSync(filepath);
      res.json({ 
        success: true, 
        message: 'File deleted successfully' 
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete file' });
    }
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'File not found' 
    });
  }
});

module.exports = router;
