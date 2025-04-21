const jwt = require('jsonwebtoken');
const Restaurant = require('../Models/Restaurant');
const User = require('../Models/User');

const authMiddleware = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401)
        .json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.type === 'restaurant') {
      user = await Restaurant.findOne({ _id: decoded._id, email: decoded.email });
    } else {
      user = await User.findOne({ _id: decoded._id, email: decoded.email });
    }

    if (!user) {
      return res.status(401)
        .json({ success: false, message: 'User not found' });
    }

    req.user = user;
    req.user.type = decoded.type || 'user';
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = authMiddleware;
