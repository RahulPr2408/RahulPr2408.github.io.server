const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const UserModel = require("../Models/User");
const RestaurantModel = require("../Models/Restaurant");
const { uploadToCloudinary } = require('../config/cloudinary');
const cloudinary = require('cloudinary').v2;


// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(409)
        .json({ message: 'User is already exist, you can login', success: false });
    }
    const userModel = new UserModel({ name, email, password });
    userModel.password = await bcrypt.hash(password, 10);
    await userModel.save();
    res.status(201)
      .json({
        message: "Signup successfully",
        success: true
      })
  } catch (err) {
    res.status(500)
      .json({
        message: "Internal server errror",
        success: false
      })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    const errorMsg = 'Auth failed email or password is wrong';
    if (!user) {
      return res.status(403)
        .json({ message: errorMsg, success: false });
    }
    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) {
      return res.status(403)
        .json({ message: errorMsg, success: false });
    }
    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(200)
      .json({
        message: "Login Success",
        success: true,
        jwtToken,
        email,
        name: user.name
      })
  } catch (err) {
    res.status(500)
      .json({
        message: "Internal server errror",
        success: false
      })
  }
}

// In AuthController.js, replace your restaurantSignup function with this:
const restaurantSignup = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    
    // Log request info for debugging
    console.log("Restaurant signup request received");
    console.log("Form data:", { name, email, address, phone });
    console.log("Files received:", req.files ? Object.keys(req.files) : "No files");

    // Check if restaurant exists
    const existingRestaurant = await RestaurantModel.findOne({ email });
    if (existingRestaurant) {
      return res.status(409).json({ 
        message: 'Restaurant with this email already exists', 
        success: false 
      });
    }

    // Initialize logo and map variables
    let logoImageUrl = null;
    let mapImageUrl = null;

    // Upload logo image if exists
    if (req.files && req.files.logoImage) {
      console.log("Uploading logo image...");
      try {
        const result = await cloudinary.uploader.upload(req.files.logoImage.tempFilePath, {
          folder: 'restaurants/logos',
          resource_type: 'auto'
        });
        logoImageUrl = {
          url: result.secure_url,
          public_id: result.public_id
        };
        console.log("Logo uploaded successfully:", logoImageUrl.url);
      } catch (error) {
        console.error("Logo upload error:", error);
        // Continue without failing the whole process
      }
    }

    // Upload map image if exists
    if (req.files && req.files.mapImage) {
      console.log("Uploading map image...");
      try {
        const result = await cloudinary.uploader.upload(req.files.mapImage.tempFilePath, {
          folder: 'restaurants/maps',
          resource_type: 'auto'
        });
        mapImageUrl = {
          url: result.secure_url,
          public_id: result.public_id
        };
        console.log("Map uploaded successfully:", mapImageUrl.url);
      } catch (error) {
        console.error("Map upload error:", error);
        // Continue without failing the whole process
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new restaurant
    const newRestaurant = new RestaurantModel({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
      logoImage: logoImageUrl,
      mapImage: mapImageUrl
    });
    
    // Save to database
    await newRestaurant.save();
    console.log("Restaurant registered successfully");
    
    res.status(201).json({
      message: 'Restaurant registered successfully!',
      success: true
    });
  } catch (error) {
    console.error('Error during restaurant signup:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      success: false,
      error: error.message 
    });
  }
};

const restaurantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const restaurant = await RestaurantModel.findOne({ email });
    const errorMsg = 'Invalid email or password';
    if (!restaurant) {
      return res.status(403)
        .json({ message: errorMsg, success: false });
    }
    const isPassEqual = await bcrypt.compare(password, restaurant.password);
    if (!isPassEqual) {
      return res.status(403)
        .json({ message: errorMsg, success: false });
    }
    const jwtToken = jwt.sign(
      { email: restaurant.email, _id: restaurant._id, type: 'restaurant' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200)
      .json({
        message: "Login Success",
        success: true,
        jwtToken,
        email,
        name: restaurant.name,
        _id: restaurant._id
      });
  } catch (err) {
    res.status(500)
      .json({
        message: "Internal server error",
        success: false
      });
  }
};

module.exports = {
  signup,
  login,
  restaurantSignup,
  restaurantLogin
};