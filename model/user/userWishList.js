const mongoose = require('mongoose');
const wishListSchema = new  mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },items : [
        {
            productId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            }
        }
    ]
});
module.exports = mongoose.model("Wishlist",wishListSchema);