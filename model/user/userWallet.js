const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },balance:{
        type:Number
    },history:[{
        amount:{
            type:Number
        },date:{
           type: Date,
        default: Date.now
        },
        transactionType:{
            type:String
        },description:{
            type:String
        },transactionId:{
            type:String,
            required:true
        }
    }]
});
module.exports = mongoose.model('Wallet', walletSchema);