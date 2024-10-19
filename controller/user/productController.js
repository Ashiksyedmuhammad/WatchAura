const mongoose = require("mongoose");
const Category = require("../../model/admin/categoryList");
const Product = require('../../model/admin/productModel');
const User = require('../../model/user/userModel');
const Cart = require('../../model/user/cart');
require('dotenv').config();



const loadShop = async (req, res) => {
    try {
        const [products, categories] = await Promise.all([
            Product.find({ isListed: true }),
            Category.find({})
        ]);
        const userData = await User.find({ _id: req.session.userSession })
        res.render('shope', {
            products,
            categories,
            userData,
            item:{productId:products,quantity:1}
            
        });
    } catch (error) {
        console.error('Error Loading Shop:', error);
        res.status(500).json({ success: false, message: 'An error occurred while loading the shop' });
    }
};

const productDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        const userData = await User.find({ _id: req.session.userSession })
        if (!product || !product.isListed) {
            return res.status(404).json({ success: false, message: 'Product not found or not available' });
        }  
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId },
            isListed: true
        }).limit(4);

        res.render('productDetails', { product, relatedProducts,userData });
    } catch (error) {
        console.error('Error Getting Product Details:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching product details' });
    }
}





module.exports = {
    loadShop,
    productDetails
    
}