const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const UserModel = require("../Models/User");
const RestaurantModel = require("../Models/Restaurant");
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

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

const restaurantSignup = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    
    // Check if restaurant already exists
    const restaurant = await RestaurantModel.findOne({ email });
    if (restaurant) {
      return res.status(409)
        .json({ message: 'Restaurant already exists', success: false });
    }
    
    // Create restaurant model with basic info and default images
    const restaurantData = { 
      name, 
      email, 
      password: await bcrypt.hash(password, 10), 
      address, 
      phone,
      logoImage: {
        url: process.env.DEFAULT_RESTAURANT_LOGO_URL,
        publicId: null
      },
      mapImage: {
        url: process.env.DEFAULT_RESTAURANT_MAP_URL,
        publicId: null
      }
    };
    
    // Handle image uploads from middleware
    if (req.logoUrl) {
      restaurantData.logoImage = {
        url: req.logoUrl.default,
        publicId: req.logoUrl.public_id
      };
    }
    
    if (req.mapUrl) {
      restaurantData.mapImage = {
        url: req.mapUrl.default,
        publicId: req.mapUrl.public_id
      };
    }
    
    // Save the restaurant
    const restaurantModel = new RestaurantModel(restaurantData);
    await restaurantModel.save();
    
    res.status(201)
      .json({
        message: "Restaurant registered successfully",
        success: true
      });
  } catch (error) {
    console.error('Restaurant Registration Error:', error);
    
    // Cleanup any uploaded images in case of error
    if (req.logoUrl?.public_id) {
      await deleteFromCloudinary(req.logoUrl.default);
    }
    if (req.mapUrl?.public_id) {
      await deleteFromCloudinary(req.mapUrl.default);
    }
    
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false
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