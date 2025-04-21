const MenuItem = require('../Models/MenuItem');
const Restaurant = require('../Models/Restaurant');
const path = require('path');
const fs = require('fs');

// Add this new function to handle restaurant profile updates including images
const updateRestaurantProfile = async (req, res) => {
  try {
    const updateData = {};
    
    console.log('Restaurant profile update request received');
    console.log('Restaurant ID:', req.restaurant?._id);
    console.log('Request body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    
    // Handle regular form fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.address) updateData.address = req.body.address;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.openTime) updateData.openTime = req.body.openTime;
    if (req.body.closeTime) updateData.closeTime = req.body.closeTime;
    if (req.body.isOpen !== undefined) updateData.isOpen = req.body.isOpen;
    if (req.body.menuType) updateData.menuType = req.body.menuType;
    
    // Handle file uploads
    if (req.files) {
      const uploadDir = path.join(__dirname, '../../public/uploads/restaurants');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Handle logo image
      if (req.files.logoImage) {
        const logoFile = req.files.logoImage;
        const logoFileName = `logo_${req.restaurant._id}_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(logoFile.name)}`;
        const logoPath = path.join(uploadDir, logoFileName);
        
        await logoFile.mv(logoPath);
        updateData.logoImage = `/uploads/restaurants/${logoFileName}`;
      }
      
      // Handle map image
      if (req.files.mapImage) {
        const mapFile = req.files.mapImage;
        const mapFileName = `map_${req.restaurant._id}_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(mapFile.name)}`;
        const mapPath = path.join(uploadDir, mapFileName);
        
        await mapFile.mv(mapPath);
        updateData.mapImage = `/uploads/restaurants/${mapFileName}`;
      }
    }
    
    if (!req.restaurant || !req.restaurant._id) {
      return res.status(401)
        .json({ success: false, message: "Restaurant not authenticated or ID missing" });
    }
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      updateData,
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404)
        .json({ success: false, message: "Restaurant not found" });
    }
    
    console.log('Restaurant profile updated successfully');
    
    res.header('Content-Type', 'application/json')
       .status(200)
       .json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.header('Content-Type', 'application/json')
       .status(500)
       .json({ success: false, message: error.message || "Internal server error" });
  }
};

const updateRestaurantStatus = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Restaurant not authenticated"
      });
    }

    const { isOpen, openTime, closeTime } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user._id,
      { isOpen, openTime, closeTime },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

const addMenuItem = async (req, res) => {
  try {
    const menuItem = new MenuItem({
      ...req.body,
      restaurantId: req.restaurant._id
    });
    await menuItem.save();
    res.header('Content-Type', 'application/json')
       .status(201)
       .json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Add Menu Item Error:', error);
    res.header('Content-Type', 'application/json')
       .status(500)
       .json({ success: false, message: error.message || "Internal server error" });
  }
};

const getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.restaurant._id });
    res.header('Content-Type', 'application/json')
       .status(200)
       .json({ success: true, data: menuItems });
  } catch (error) {
    console.error('Get Menu Items Error:', error);
    res.header('Content-Type', 'application/json')
       .status(500)
       .json({ success: false, message: error.message || "Internal server error" });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurant._id },
      req.body,
      { new: true }
    );
    if (!menuItem) {
      return res.header('Content-Type', 'application/json')
                .status(404)
                .json({ success: false, message: "Item not found" });
    }
    res.header('Content-Type', 'application/json')
       .status(200)
       .json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Update Menu Item Error:', error);
    res.header('Content-Type', 'application/json')
       .status(500)
       .json({ success: false, message: error.message || "Internal server error" });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurant._id
    });
    if (!menuItem) {
      return res.header('Content-Type', 'application/json')
                .status(404)
                .json({ success: false, message: "Item not found" });
    }
    res.header('Content-Type', 'application/json')
       .status(200)
       .json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Delete Menu Item Error:', error);
    res.header('Content-Type', 'application/json')
       .status(500)
       .json({ success: false, message: error.message || "Internal server error" });
  }
};

const getRestaurantProfile = async (req, res) => {
  try {
    if (!req.restaurant || !req.restaurant._id) {
      return res.status(401)
        .json({ success: false, message: "Restaurant not authenticated" });
    }

    const restaurant = await Restaurant.findById(req.restaurant._id);
    if (!restaurant) {
      return res.status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Get Restaurant Profile Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

module.exports = {
  updateRestaurantProfile,
  updateRestaurantStatus,
  addMenuItem,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem,
  getRestaurantProfile
};
