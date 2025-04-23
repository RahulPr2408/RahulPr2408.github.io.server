const { signup, login, restaurantSignup, restaurantLogin } = require('../Controllers/AuthController');
const { signupValidation, loginValidation, restaurantValidation } = require('../Middlewares/AuthValidation');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../Middlewares/authMiddleware');
const fileUpload = require('express-fileupload');
const path = require('path'); // Needed if using local temp dir, but good to have
const fs = require('fs'); // Needed if using local temp dir or checking existence

const router = require('express').Router();

// --- express-fileupload Configuration ---
// Increased file size limit to 10MB
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/', // Default temp dir, usually works on Render. Change if needed.
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  abortOnLimit: false, // Abort if limit is exceeded (can cause 'Unexpected end of form')
  debug: true // Enable debug logging for express-fileupload
}));
// --- End express-fileupload Configuration ---

// User routes
router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);

// Restaurant routes - using loginValidation for login since it only checks email and password
router.post('/restaurant/login', loginValidation, restaurantLogin);

// Modified Restaurant Signup Route Handler Wrapper
router.post('/restaurant/signup', async (req, res, next) => {
  try {
    console.log('Signup request received on route /api/auth/restaurant/signup');
    console.log('Request Body:', req.body); // Log text fields
    // Log file details IF files exist
    if (req.files) {
       console.log('Files received:', JSON.stringify(Object.keys(req.files))); // Log which file keys arrived
    } else {
       console.log('No files received in request.');
    }


    if (!req.files && !req.body) {
      console.log('No data received at all.');
      return res.status(400).json({
        success: false,
        message: 'No data received'
      });
    }

    // Call the actual controller logic
    await restaurantSignup(req, res, next); // Pass next to allow controller to call it on error

  } catch (error) {
    // Catch errors specifically from this wrapper/middleware level if needed
    console.error('Error in /restaurant/signup route handler:', error);
    // Ensure the error is passed to the main error handler
    // Check if the error is from file upload limit specifically
     if (error.message && error.message.includes('LIMIT_FILE_SIZE')) {
        return res.status(413).json({ // 413 Payload Too Large
            success: false,
            message: 'File size limit exceeded. Please upload smaller files (max 10MB).',
            error: error.message
        });
     }
     // Check for the busboy specific error
     if (error.message && error.message.includes('Unexpected end of form')) {
        return res.status(400).json({
            success: false,
            message: 'File upload was interrupted or incomplete. Please try again.',
            error: error.message
        });
     }
    next(error); // Pass to your global error handler
  }
});

// Token verification route
router.get('/verify', authMiddleware, (req, res) => {
  res.status(200).json({
    valid: true,
    user: {
      email: req.user.email,
      name: req.user.name,
      type: req.user.type || 'user',
      _id: req.user._id // Include ID if needed by frontend
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