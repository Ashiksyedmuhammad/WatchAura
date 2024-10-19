const { type } = require('event');
const mongoose = require('mongoose');

const userOrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    orderId:{
        type: String
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        cancellationReason:{
            type:String
        },
        image:{
            type: String
        },
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Pending'
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    shippingAddress: {
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        address: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        },
        postal_code: {
            type: String
        },
        phone: {
            type: String
        }
    },
    couponApplied: {
        type: String,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
    paymentMethod: {
        type: String
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Pending', `Completed`, 'Failed'],
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['Placed',  'Shipped', 'Delivered'],
        default: 'Placed'
    }
},{
    timestamps:true
});


module.exports = mongoose.model('Order',userOrderSchema);