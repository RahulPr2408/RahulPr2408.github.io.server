const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const path = require('path');
const fs = require('fs'); // Import fs module
const UserModel = require("../Models/User");
const RestaurantModel = require("../Models/Restaurant");
const { uploadToCloudinary } = require('../config/cloudinary');

// signup and login functions remain the same...
const signup = async (req, res, next) => { // Added next for error handling consistency
  try {
    const { name, email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(409)
        .json({ message: 'User already exists, you can login', success: false });
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
    console.error("Error during user signup:", err);
    next(err); // Pass error to global handler
  }
}

const login = async (req, res, next) => { // Added next
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
     console.error("Error during user login:", err);
     next(err); // Pass error to global handler
  }
}


// --- Modified restaurantSignup ---
const restaurantSignup = async (req, res, next) => { // Added next parameter
  console.log('Processing restaurant signup in controller...');
  try {
    const { name, email, password, address, phone } = req.body;

    // Basic Validation (consider using a validation library like Joi or express-validator)
    if (!name || !email || !password || !address || !phone) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, password, address, phone) are required'
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await RestaurantModel.findOne({ email });
    if (existingRestaurant) {
      console.log(`Signup attempt failed: Restaurant with email ${email} already exists.`);
      return res.status(409).json({
        success: false,
        message: 'Restaurant with this email already exists'
      });
    }

    // Handle file uploads
    let logoImageUrl = null;
    let mapImageUrl = null;

    // Log the files object received by the controller
    console.log('req.files in controller:', req.files ? JSON.stringify(Object.keys(req.files)) : 'null');

    if (req.files) {
      console.log('Processing file uploads...');
      // Process logo image
      if (req.files.logoImage) {
        const logoFile = req.files.logoImage;
        console.log(`Processing logoImage: ${logoFile.name}, Size: ${logoFile.size}, Temp Path: ${logoFile.tempFilePath}`);
        if (!fs.existsSync(logoFile.tempFilePath)) {
           console.error(`CRITICAL: Logo temp file does NOT exist at path: ${logoFile.tempFilePath}`);
           // Decide how to handle: maybe return 500 or try proceeding without it
           return res.status(500).json({ success: false, message: "Server error processing logo file."});
        }
        try {
           console.log('Uploading logo image to Cloudinary...');
           logoImageUrl = await uploadToCloudinary(logoFile.tempFilePath, 'restaurants/logos');
           console.log(`Logo image uploaded successfully: ${logoImageUrl}`);
           console.log(`Attempting to delete logo temp file: ${logoFile.tempFilePath}`);
           fs.unlinkSync(logoFile.tempFilePath); // Delete temp file *after* successful upload
           console.log(`Logo temp file deleted successfully.`);
        } catch (uploadError) {
           console.error('Error uploading logo image to Cloudinary:', uploadError);
           // Attempt to clean up temp file even if upload failed
           if (fs.existsSync(logoFile.tempFilePath)) {
              try { fs.unlinkSync(logoFile.tempFilePath); console.log("Cleaned up failed logo temp file.") } catch (e) { console.error("Error cleaning up failed logo temp file:", e)}
           }
           // Let the main catch block handle the response
           throw new Error(`Logo image upload failed: ${uploadError.message}`);
        }
      } else {
        console.log("No logoImage file provided in the request.");
      }

      // Process map image
      if (req.files.mapImage) {
        const mapFile = req.files.mapImage;
        console.log(`Processing mapImage: ${mapFile.name}, Size: ${mapFile.size}, Temp Path: ${mapFile.tempFilePath}`);
         if (!fs.existsSync(mapFile.tempFilePath)) {
           console.error(`CRITICAL: Map temp file does NOT exist at path: ${mapFile.tempFilePath}`);
           return res.status(500).json({ success: false, message: "Server error processing map file."});
        }
        try {
           console.log('Uploading map image to Cloudinary...');
           mapImageUrl = await uploadToCloudinary(mapFile.tempFilePath, 'restaurants/maps');
           console.log(`Map image uploaded successfully: ${mapImageUrl}`);
           console.log(`Attempting to delete map temp file: ${mapFile.tempFilePath}`);
           fs.unlinkSync(mapFile.tempFilePath); // Delete temp file *after* successful upload
           console.log(`Map temp file deleted successfully.`);
        } catch (uploadError) {
           console.error('Error uploading map image to Cloudinary:', uploadError);
           if (fs.existsSync(mapFile.tempFilePath)) {
               try { fs.unlinkSync(mapFile.tempFilePath); console.log("Cleaned up failed map temp file.") } catch (e) { console.error("Error cleaning up failed map temp file:", e)}
           }
           throw new Error(`Map image upload failed: ${uploadError.message}`);
        }
      } else {
         console.log("No mapImage file provided in the request.");
      }
    } else {
      console.log('No files attached to the request.');
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed.');

    // Create new restaurant
    console.log('Creating new RestaurantModel instance...');
    const restaurant = new RestaurantModel({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
      logoImage: logoImageUrl, // Will be null if upload failed or no file provided
      mapImage: mapImageUrl   // Will be null if upload failed or no file provided
    });

    console.log('Saving restaurant to database...');
    await restaurant.save();
    console.log('Restaurant saved successfully.');

    res.status(201).json({
      success: true,
      message: "Restaurant registered successfully"
    });

  } catch (error) {
    console.error('Error during restaurant signup process:', error);
    // Check if the error originated from file size limit (might be caught earlier, but as fallback)
    if (error.message && error.message.includes('LIMIT_FILE_SIZE')) {
       return res.status(413).json({
           success: false,
           message: 'File size limit exceeded (max 10MB).',
           error: error.message
       });
    }
    // Pass the error to the central error handler
    next(error);
  }
};
// --- End Modified restaurantSignup ---

// --- Modified restaurantLogin ---
const restaurantLogin = async (req, res, next) => { // Added next
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
        _id: restaurant._id // Send _id for restaurant context if needed
      });
  } catch (err) {
    console.error("Error during restaurant login:", err);
    next(err); // Pass error to global handler
  }
};
// --- End Modified restaurantLogin ---

module.exports = {
  signup,
  login,
  restaurantSignup,
  restaurantLogin
};