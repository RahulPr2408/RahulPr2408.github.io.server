const jwt = require('jsonwebtoken');
const Restaurant = require('../Models/Restaurant');
const User = require('../Models/User');

const authMiddleware = async (req, res, next) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).json({});
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.type === 'restaurant') {
      user = await Restaurant.findOne({ _id: decoded._id, email: decoded.email });
      // Set both user and restaurant context for restaurant users
      req.user = user;
      req.restaurant = user;
      req.userType = 'restaurant';
    } else {
      user = await User.findOne({ _id: decoded._id, email: decoded.email });
      req.user = user;
      req.userType = 'user';
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Set CORS headers for authenticated routes
    res.header('Access-Control-Allow-Credentials', 'true');

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

module.exports = authMiddleware;
