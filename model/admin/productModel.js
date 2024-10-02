const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    images: {
       type : [String]
    },
    category: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Category',
         required: true
     },
    isListed:{
        type:Boolean,
        require:true
    },
    stock:{
        type:Number,
        require:true
    },
    price:{
        type:Number,
        require:true
    },    
},
{timestamps:true}
);
module.exports = mongoose.model('Product',productSchema);