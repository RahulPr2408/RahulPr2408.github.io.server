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
    const { name, email, password, address, phone } = req.body;
    let logoImageUrl = null;
    let mapImageUrl = null;

    if (req.files && req.files.logoImage) {
      logoImageUrl = await uploadToCloudinary(req.files.logoImage, 'restaurants/logos');
    }

    if (req.files && req.files.mapImage) {
      mapImageUrl = await uploadToCloudinary(req.files.mapImage, 'restaurants/maps');
    }

    const newRestaurant = new RestaurantModel({
      name,
      email,
      password,
      address,
      phone,
      logoImage: logoImageUrl,
      mapImage: mapImageUrl,
    });

    await newRestaurant.save();
    res.status(201).json({ message: 'Restaurant registered successfully!' });
  } catch (error) {
    console.error('Error during restaurant signup:', error);
    res.status(500).json({ message: 'Internal server error' });
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