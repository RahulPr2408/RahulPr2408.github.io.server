const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const jwt = require('jsonwebtoken')
const UserModel = require('./Models/User')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const AuthRouter = require('./Routes/AuthRouter')
const DashboardRouter = require('./Routes/DashboardRouter')
const RestaurantRouter = require('./Routes/RestaurantRouter')
const errorHandler = require('./Middlewares/errorHandler')
const path = require('path')

require('dotenv').config()
require('./Models/db')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Passport config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      const existingUser = await UserModel.findOne({ email: profile.emails[0].value });
      if (existingUser) {
        return done(null, existingUser);
      }
      
      const newUser = new UserModel({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: 'google-oauth'
      });
      await newUser.save();
      done(null, newUser);
    } catch (error) {
      done(error, null);
    }
  }
));

app.use(passport.initialize());

// CORS and middleware configuration
app.use(cors({
  origin: ['https://secondplate.org', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());



// In index.js, replace your existing fileUpload middleware with this:
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  createParentPath: true,
  debug: true,
  // Add custom Busboy options
  busboyOptions: {
    highWaterMark: 2 * 1024 * 1024, // 2MB - increase internal buffer size
    limits: {
      fieldSize: 2 * 1024 * 1024 // 2MB
    }
  }
}));

// Add this middleware to debug incoming requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('Request headers:', req.headers);
    console.log('Request has files:', !!req.files);
    if (req.files) {
      console.log('Files:', Object.keys(req.files));
    }
  }
  next();
});

// Simple error handler for file upload errors
app.use((err, req, res, next) => {
  if (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'File upload error', 
      error: err.message 
    });
  }
  next();
});



// API routes
app.use('/api/auth', AuthRouter)
app.use('/api/dashboard', DashboardRouter)
app.use('/api/restaurants', RestaurantRouter)

// Auth routes that don't have the /api prefix
app.use('/auth', AuthRouter)

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')))

// Serve static files from build directory
app.use(express.static(path.join(__dirname, '..', 'build')))

// Handle client-side routing - this must come after API routes
app.get('/*', (req, res) => {
  // Don't redirect API or auth routes
  if (req.url.startsWith('/api/') || req.url.startsWith('/auth/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`)
})