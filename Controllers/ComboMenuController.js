const { Combo, ProteinOption, SideOption } = require('../Models/ComboMenu');

// Get all combo menu items for a restaurant
const getComboMenuItems = async (req, res) => {
  try {
    const combos = await Combo.find({ restaurantId: req.restaurant._id });
    const proteins = await ProteinOption.find({ restaurantId: req.restaurant._id });
    const sides = await SideOption.find({ restaurantId: req.restaurant._id });

    res.status(200).json({
      success: true,
      data: {
        combos,
        proteins,
        sides
      }
    });
  } catch (error) {
    console.error('Error fetching combo menu items:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Add a new combo
const addCombo = async (req, res) => {
  try {
    const { name, description, originalPrice, salePrice } = req.body;

    const combo = new Combo({
      restaurantId: req.restaurant._id,
      name,
      description,
      originalPrice,
      salePrice
    });

    await combo.save();

    res.status(201).json({
      success: true,
      data: combo
    });
  } catch (error) {
    console.error('Error adding combo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Update an existing combo
const updateCombo = async (req, res) => {
  try {
    const { name, description, originalPrice, salePrice } = req.body;
    
    const combo = await Combo.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurant._id },
      { name, description, originalPrice, salePrice },
      { new: true }
    );

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    res.status(200).json({
      success: true,
      data: combo
    });
  } catch (error) {
    console.error('Error updating combo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a combo
const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurant._id
    });

    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Combo deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting combo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Add a new protein option
const addProteinOption = async (req, res) => {
  try {
    const { name } = req.body;

    const protein = new ProteinOption({
      restaurantId: req.restaurant._id,
      name,
      isAvailable: true
    });

    await protein.save();

    res.status(201).json({
      success: true,
      data: protein
    });
  } catch (error) {
    console.error('Error adding protein option:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a protein option
const deleteProteinOption = async (req, res) => {
  try {
    const protein = await ProteinOption.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurant._id
    });

    if (!protein) {
      return res.status(404).json({
        success: false,
        message: 'Protein option not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Protein option deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting protein option:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Add a new side option
const addSideOption = async (req, res) => {
  try {
    const { name } = req.body;

    const side = new SideOption({
      restaurantId: req.restaurant._id,
      name,
      isAvailable: true
    });

    await side.save();

    res.status(201).json({
      success: true,
      data: side
    });
  } catch (error) {
    console.error('Error adding side option:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a side option
const deleteSideOption = async (req, res) => {
  try {
    const side = await SideOption.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurant._id
    });

    if (!side) {
      return res.status(404).json({
        success: false,
        message: 'Side option not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Side option deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting side option:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getComboMenuItems,
  addCombo,
  updateCombo,
  deleteCombo,
  addProteinOption,
  deleteProteinOption,
  addSideOption,
  deleteSideOption
}; 