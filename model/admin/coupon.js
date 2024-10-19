const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    discount: {
        type: Number,
        required: true
    },
    minPurchaseAmount: {
        type: Number,
        required: true
    },
    maxAmount: {
        type: Number,
        required: true
    },
    couponId: {
        type: String,
        required: true,
        unique: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);