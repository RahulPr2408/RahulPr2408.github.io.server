const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ComboSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'restaurants',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  salePrice: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const ProteinOptionSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'restaurants',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const SideOptionSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'restaurants',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Combo = mongoose.model('combos', ComboSchema);
const ProteinOption = mongoose.model('proteinOptions', ProteinOptionSchema);
const SideOption = mongoose.model('sideOptions', SideOptionSchema);

module.exports = {
  Combo,
  ProteinOption,
  SideOption
}; 