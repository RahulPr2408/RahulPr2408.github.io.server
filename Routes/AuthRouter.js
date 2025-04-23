const { signup, login, restaurantSignup, restaurantLogin } = require('../Controllers/AuthController');
const { signupValidation, loginValidation, restaurantValidation } = require('../Middlewares/AuthValidation');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../Middlewares/authMiddleware');
const fileUpload = require('express-fileupload');

const router = require('express').Router();

// Configure express-fileupload with more reliable settings
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit (reduced from 5MB)
    parts: 30 // Increase max fields/parts
  },
  abortOnLimit: true,
  debug: true,
  preserveExtension: true,
  safeFileNames: true,
  parseNested: true,
  uploadTimeout: 60000 // 60-second timeout
}));

// User routes
router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);

// Restaurant routes
router.post('/restaurant/login', loginValidation, restaurantLogin);
router.post('/restaurant/signup', async (req, res, next) => {
  try {
    console.log('Signup request received');
    
    // Better request validation
    if (!req.body || !req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Debug log but with sensitive data redacted
    console.log('Files received:', req.files ? Object.keys(req.files) : 'None');
    console.log('Form fields received:', Object.keys(req.body));
    
    await restaurantSignup(req, res);
  } catch (error) {
    console.error('Restaurant signup error:', error);
    
    // More informative error response
    if (error.message && error.message.includes('Unexpected end of form')) {
      return res.status(400).json({
        success: false,
        message: 'File upload was interrupted. Please try uploading smaller images or check your network connection.',
        error: error.message
      });
    }
    
    next(error);
  }
});

// Token verification route
router.get('/verify', authMiddleware, (req, res) => {
  res.status(200).json({
    valid: true,
    user: {
      email: req.user.email,
      name: req.user.name,
      type: req.user.type || 'user'
    }
  });
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { email: req.user.email, _id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
   
    const redirectUrl = `${process.env.FRONTEND_URL}/oauth-callback?token=${token}&name=${encodeURIComponent(req.user.name)}`;
    res.redirect(redirectUrl);
  }
);

// Restaurant Google OAuth routes
router.get('/restaurant/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: 'restaurant' // To identify restaurant login flow
  })
);

router.get('/restaurant/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { email: req.user.email, _id: req.user._id, type: 'restaurant' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
   
    const redirectUrl = `${process.env.FRONTEND_URL}/oauth-callback?token=${token}&name=${encodeURIComponent(req.user.name)}&isRestaurant=true&id=${req.user._id}`;
    res.redirect(redirectUrl);
  }
);

router.get('/test', (req, res) => {
  res.json({ status: 'Auth API is working' });
});

module.exports = router;