const router = require('express').Router();
const Restaurant = require('../Models/Restaurant');
const MenuItem = require('../Models/MenuItem'); // Import MenuItem model
const { Combo, ProteinOption, SideOption } = require('../Models/ComboMenu'); // Import Combo Menu models
const { deleteFromCloudinary } = require('../config/cloudinary');
const cors = require('cors');

// Apply CORS middleware for specific routes if needed
const corsOptions = {
  origin: ['https://secondplate.org', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

router.get('/', cors(corsOptions), async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
});

// DELETE route to remove a restaurant and cleanup its images
router.delete('/:id', cors(corsOptions), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Cleanup images from Cloudinary if they're not default images
    if (restaurant.logoImage && !restaurant.logoImage.includes('default')) {
      await deleteFromCloudinary(restaurant.logoImage);
    }
    if (restaurant.mapImage && !restaurant.mapImage.includes('default')) {
      await deleteFromCloudinary(restaurant.mapImage);
    }

    // Delete the restaurant and its related data
    await Promise.all([
      Restaurant.findByIdAndDelete(req.params.id),
      MenuItem.deleteMany({ restaurantId: req.params.id }),
      Combo.deleteMany({ restaurantId: req.params.id }),
      ProteinOption.deleteMany({ restaurantId: req.params.id }),
      SideOption.deleteMany({ restaurantId: req.params.id })
    ]);

    res.status(200).json({ message: 'Restaurant and related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Failed to delete restaurant' });
  }
});

// GET route to fetch menu items for a specific restaurant
router.get('/:restaurantId/menu', cors(corsOptions), async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // If restaurant uses standard menu, return regular menu items
    if (restaurant.menuType === 'standard' || !restaurant.menuType) {
      const menuItems = await MenuItem.find({ restaurantId: restaurantId });
      return res.status(200).json(menuItems);
    } 
    // If restaurant uses combo menu, return combo menu items
    else if (restaurant.menuType === 'combo') {
      const combos = await Combo.find({ restaurantId: restaurantId });
      const proteins = await ProteinOption.find({ restaurantId: restaurantId });
      const sides = await SideOption.find({ restaurantId: restaurantId });
      
      return res.status(200).json({
        menuType: 'combo',
        combos,
        proteins,
        sides
      });
    }
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// GET route to fetch only combo menu items for a specific restaurant
router.get('/:restaurantId/combo-menu', async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // If restaurant doesn't use combo menu, return empty arrays
    if (restaurant.menuType !== 'combo') {
      return res.status(200).json({
        menuType: restaurant.menuType || 'standard',
        combos: [],
        proteins: [],
        sides: []
      });
    }
    
    const combos = await Combo.find({ restaurantId: restaurantId });
    const proteins = await ProteinOption.find({ restaurantId: restaurantId });
    const sides = await SideOption.find({ restaurantId: restaurantId });
    
    res.status(200).json({
      menuType: 'combo',
      combos,
      proteins,
      sides
    });
  } catch (error) {
    console.error('Error fetching combo menu items:', error);
    res.status(500).json({ message: 'Failed to fetch combo menu items' });
  }
});

module.exports = router;
