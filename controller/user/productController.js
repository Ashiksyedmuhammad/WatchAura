const mongoose = require("mongoose");
const Category = require("../../model/admin/categoryList");
const Product = require('../../model/admin/productModel');
const User = require('../../model/user/userModel');
const Cart = require('../../model/user/cart');
require('dotenv').config();




const loadShop = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        const { 
            sort = 'featured',
            search = '',
            minPrice,
            maxPrice,
            category,
            page = 1 
        } = req.query;

        const limit = 8; 
        const skip = (page - 1) * limit;

        let query = { isListed: true };

        if (search) {
            query.productName = { $regex: search, $options: 'i' };
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        let sortQuery = {};
        switch (sort) {
            case 'price_asc':
                sortQuery = { price: 1 };
                break;
            case 'price_desc':
                sortQuery = { price: -1 };
                break;
            case 'name_asc':
                sortQuery = { productName: 1 };
                break;
            case 'name_desc':
                sortQuery = { productName: -1 };
                break;
            case 'newest':
                sortQuery = { createdAt: -1 };
                break;
            case 'rating':
                sortQuery = { averageRating: -1 };
                break;
            case 'popularity':
                sortQuery = { totalSales: -1 };
                break;
            default: 
                sortQuery = { featured: -1 };
        }

        const [products, categories, totalProducts] = await Promise.all([
            Product.find(query)
                .populate('offerId')
                .sort(sortQuery)
                .skip(skip)
                .limit(limit),
            Category.find({}),
            Product.countDocuments(query) 
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('shope', {
            userData : user,
            products,
            categories,
            currentPage: parseInt(page),
            totalPages,
            filters: {
                sort,
                search,
                minPrice,
                maxPrice,
                category
            }
        });
    } catch (error) {
        console.error('Error Loading Shop:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while loading the shop' 
        });
    }
};


const productDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('offerId');
        const userData = await User.find({ _id: req.session.userSession });
        
        if (!product || !product.isListed) {
            return res.status(404).json({ success: false, message: 'Product not found or not available' });
        }

        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId },
            isListed: true
        }).limit(4);

        res.render('productDetails', { product, relatedProducts, userData });
    } catch (error) {
        console.error('Error Getting Product Details:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching product details' });
    }
};





module.exports = {
    loadShop,
    productDetails
    
}