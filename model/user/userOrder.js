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
        cancellationReason:{
            type:String
        },
        returnReason :{
            type :String
        },
        productCondition:{
            type: String
        },
        returnRequestDate:{
            type: Date
        },
        image:{
            type: String
        },
        status: {
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Return Requested', 'Returned','Return Rejected'],
            default: 'Pending'
        },
        price:{
            type:Number,
            required:true
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
        enum: ['Pending', `Completed`, 'Failed','Refunded', 'Partially Refunded'],
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