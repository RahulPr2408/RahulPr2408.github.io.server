const { signup, login, restaurantSignup, restaurantLogin } = require('../Controllers/AuthController');
const { signupValidation, loginValidation, restaurantValidation } = require('../Middlewares/AuthValidation');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../Middlewares/authMiddleware');
const { uploadImages } = require('../Middlewares/imageUploadMiddleware');

const router = require('express').Router();

// User routes
router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);

// Restaurant routes - using loginValidation for login since it only checks email and password
router.post('/restaurant/login', loginValidation, restaurantLogin);
router.post('/restaurant/signup', uploadImages, restaurantSignup);

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

module.exports = router;