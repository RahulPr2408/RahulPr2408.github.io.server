const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const UserModel = require("../Models/User");
const RestaurantModel = require("../Models/Restaurant");
const { uploadToCloudinary } = require('../config/cloudinary');

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
    console.log('Restaurant signup request received');
    console.log('Request body:', req.body);
    console.log('Files received:', req.files);

    const { name, email, password, address, phone } = req.body;

    // Check if restaurant already exists
    const existingRestaurant = await RestaurantModel.findOne({ email });
    if (existingRestaurant) {
      return res.status(409).json({ 
        success: false, 
        message: 'Restaurant with this email already exists' 
      });
    }

    // Handle file uploads to Cloudinary
    let logoImageUrl = null;
    let mapImageUrl = null;

    if (req.files) {
      try {
        if (req.files.logoImage) {
          const result = await uploadToCloudinary(req.files.logoImage.tempFilePath, 'restaurants/logos');
          logoImageUrl = result;
          // Clean up temp file
          fs.unlinkSync(req.files.logoImage.tempFilePath);
        }

        if (req.files.mapImage) {
          const result = await uploadToCloudinary(req.files.mapImage.tempFilePath, 'restaurants/maps');
          mapImageUrl = result;
          // Clean up temp file
          fs.unlinkSync(req.files.mapImage.tempFilePath);
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading images',
          error: uploadError.message
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new restaurant
    const restaurant = new RestaurantModel({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
      logoImage: logoImageUrl,
      mapImage: mapImageUrl
    });

    await restaurant.save();
    console.log('Restaurant saved successfully');

    res.status(201).json({
      success: true,
      message: "Restaurant registered successfully"
    });
  } catch (error) {
    console.error('Restaurant signup error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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