const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
    itemId: { 
        type: mongoose.Schema.Types.ObjectId},
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', required: true
    }, userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    reason: {
        type: String,
       
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    adminResponse: {
    type : String
    }
},{
        timestamps:true
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);