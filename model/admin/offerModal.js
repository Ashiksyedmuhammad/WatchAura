const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true 
  },
  discount: {
    type: Number,
    required: true 
  },
  type: {
    type: String,
    required: true 
  },
  products: [{
   type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
  categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  expiryDate:{
    type:Date,
    index:{
      expires:0
    }
  }
}, {
  timestamps: true 
});

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

module.exports = Offer;