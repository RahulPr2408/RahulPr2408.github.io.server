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
    url: {
      type: String,
      default: function() {
        return process.env.DEFAULT_RESTAURANT_LOGO_URL;
      }
    },
    publicId: String
  },
  mapImage: {
    url: {
      type: String,
      default: function() {
        return process.env.DEFAULT_RESTAURANT_MAP_URL;
      }
    },
    publicId: String
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
}, { timestamps: true });

// Add a pre-save middleware to ensure image URLs are properly structured
RestaurantSchema.pre('save', function(next) {
  // Handle logoImage
  if (typeof this.logoImage === 'string') {
    this.logoImage = {
      url: this.logoImage,
      publicId: this.logoImage.split('/upload/')[1]?.split('.')[0]
    };
  }
  
  // Handle mapImage
  if (typeof this.mapImage === 'string') {
    this.mapImage = {
      url: this.mapImage,
      publicId: this.mapImage.split('/upload/')[1]?.split('.')[0]
    };
  }
  
  next();
});

const RestaurantModel = mongoose.model('restaurants', RestaurantSchema);

module.exports = RestaurantModel;
