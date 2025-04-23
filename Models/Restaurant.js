const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Image schema for Cloudinary image storage
const CloudinaryImageSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  }
}, { _id: false });

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
    type: CloudinaryImageSchema,
    default: null
  },
  mapImage: {
    type: CloudinaryImageSchema,
    default: null
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