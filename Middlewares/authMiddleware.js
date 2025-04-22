const jwt = require('jsonwebtoken');
const Restaurant = require('../Models/Restaurant');
const User = require('../Models/User');

const authMiddleware = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing authorization header',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.type === 'restaurant') {
      user = await Restaurant.findOne({ _id: decoded._id, email: decoded.email });
      req.restaurant = user;
      req.user = user;
      req.userType = 'restaurant';
    } else {
      user = await User.findOne({ _id: decoded._id, email: decoded.email });
      req.user = user;
      req.userType = 'user';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    let message = 'Authentication failed';
    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.message === 'JWT_SECRET is not configured') {
      message = 'Server misconfiguration: missing JWT_SECRET';
    }

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

module.exports = authMiddleware;
