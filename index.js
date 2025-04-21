const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const UserModel = require('./Models/User');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const AuthRouter = require('./Routes/AuthRouter');
const DashboardRouter = require('./Routes/DashboardRouter');
const RestaurantRouter = require('./Routes/RestaurantRouter');
const errorHandler = require('./Middlewares/errorHandler');
const path = require('path');

require('dotenv').config();
require('./Models/db');

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS configuration
const corsOptions = {
  origin: ['https://secondplate.org', process.env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Enable CORS with options
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Ensure CORS headers are set for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
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

// File upload middleware with temporary file storage for Cloudinary
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use(express.json());

// API routes
app.use('/api/auth', AuthRouter);
app.use('/api/dashboard', DashboardRouter);
app.use('/api/restaurants', RestaurantRouter);

// Auth routes that don't have the /api prefix
app.use('/auth', AuthRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Serve static files from build directory
app.use(express.static(path.join(__dirname, '..', 'build')));

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});