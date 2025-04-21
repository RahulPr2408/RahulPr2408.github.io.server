const router = require('express').Router();
const {
  updateRestaurantStatus,
  updateRestaurantProfile,
  getRestaurantProfile,
  addMenuItem,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem
} = require('../Controllers/DashboardController');

const {
  getComboMenuItems,
  addCombo,
  updateCombo,
  deleteCombo,
  addProteinOption,
  deleteProteinOption,
  addSideOption,
  deleteSideOption
} = require('../Controllers/ComboMenuController');

const authMiddleware = require('../Middlewares/authMiddleware');

router.use(authMiddleware);

// Restaurant profile and status routes
router.get('/restaurant/profile', getRestaurantProfile);
router.put('/restaurant/status', updateRestaurantStatus);
router.post('/restaurant/profile', updateRestaurantProfile);

// Standard menu item routes
router.get('/menu-items', getMenuItems);
router.post('/menu-items', addMenuItem);
router.put('/menu-items/:id', updateMenuItem);
router.delete('/menu-items/:id', deleteMenuItem);

// Combo menu routes
router.get('/combo-menu', getComboMenuItems);

// Combo routes
router.post('/combo-menu/combo', addCombo);
router.put('/combo-menu/combo/:id', updateCombo);
router.delete('/combo-menu/combo/:id', deleteCombo);

// Protein options routes
router.post('/combo-menu/protein', addProteinOption);
router.delete('/combo-menu/protein/:id', deleteProteinOption);

// Side options routes
router.post('/combo-menu/side', addSideOption);
router.delete('/combo-menu/side/:id', deleteSideOption);

module.exports = router;
