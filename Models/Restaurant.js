const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RestaurantSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  logoImage: {
    type: String,
    default: ''
  },
  mapImage: {
    type: String,
    default: ''
  },
  openTime: {
    type: String,
    default: '09:00'
  },
  closeTime: {
    type: String,
    default: '22:00'
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  menuType: {
    type: String,
    enum: ['standard', 'combo'],
    default: 'standard'
  }
});

const RestaurantModel = mongoose.model('restaurants', RestaurantSchema);
module.exports = RestaurantModel;
