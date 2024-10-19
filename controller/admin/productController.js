const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryList');
const Orders = require('../../model/user/userOrder');
const User = require('../../model/user/userModel')
const sharp = require('sharp');
const path = require('path');
const Coupon = require('../../model/admin/coupon');

const loadProducts = async (req, res) => {
    try {
        const [products, categories] = await Promise.all([
            Product.find({}),
            Category.find({}),
        ]);


        res.render('product', {
            products,
            categories
        });
    } catch (error) {
        console.error('Error Loading Products:', error);

        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const loadAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.render('addProduct', {
            categories
        });
    } catch (error) {
        console.error('Error Loading Add Product Page:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const addProduct = async (req, res) => {
    try {

        if (!req.files || typeof req.files !== 'object') {
            throw new Error('No files uploaded or incorrect file format');
        }


        const imageFields = Object.values(req.files);
        const imagePromises = imageFields.flat().map(async (file) => {
           


            if (!file.path || !file.filename) {
                console.error('Error: file.path or file.filename is undefined');
                return null;
            }

            
            const imagePath = path.resolve(file.path);
            const outputImagePath = path.join(__dirname, '../../uploads/cropped', file.filename);
           

            try {

                await sharp(imagePath)
                    .resize(200, 200)
                    .toFile(outputImagePath);

              
                return file.filename;
            } catch (err) {
                console.error('Error cropping image:', err);
                return null;
            }
        });

        
        const imageResults = await Promise.all(imagePromises);
        const images = imageResults.filter(filename => filename); 

       
        const productData = {
            productName: req.body['productTitle'],
            description: req.body['ProductDescription'],
            price: parseFloat(req.body['productPrice']),
            category: req.body['categorySelection'],
            stock: parseInt(req.body['productCount']),
            isListed: req.body['productOption'],
            images: images
        };

        const newProduct = new Product(productData);
        await newProduct.save();

        res.status(200).json({ success: true, message: 'Product added successfully!', red: '/admin/product' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'Error adding product: ' + error.message });
    }
};


const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const [product, categories] = await Promise.all([
            Product.findById(productId),
            Category.find({})
        ]);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.render('editProduct', {
            product,
            categories
        });
    } catch (error) {
        console.error('Error Loading Edit Product Page:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = {
            productName: req.body.productTitle,
            description: req.body.ProductDescription,
            price: parseFloat(req.body.productPrice),
            category: req.body.categorySelection,
            stock: parseInt(req.body.productCount),
            isListed: req.body.productOption === 'true'
        };

        const imageFiles = req.files;
        const images = [];


        for (let i = 1; i <= 3; i++) {
            const fieldName = `productImage${i}`;
            if (imageFiles[fieldName] && imageFiles[fieldName][0]) {
                images.push(imageFiles[fieldName][0].filename);
            } else {

                const existingImageField = `existingImage${i}`;
                if (req.body[existingImageField]) {
                    images.push(req.body[existingImageField]);
                }
            }
        }

        updatedData.images = images

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, message: 'Product edited successfully!', redirect: '/admin/product' });
    } catch (error) {
        console.error('Error edited product:', error);
        res.status(500).json({ success: false, message: 'Error editing product: ' + error.message });
    }
};

const loadOrders = async (req, res) => {
    try {
        const orders = await Orders.find({}).populate('userId items.productId paymentMethod')

        res.render('orders', {
            orders
        });
    } catch (error) {
        console.error('Error Loading Products:', error);

        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};
const cancelOrder = async (req, res) => {
    try {
        const { _id, itemId } = req.body;
        const order = await Orders.findById(_id).populate('paymentMethod').populate('items.productId')
        const products = order.items.find(product => product.equals(itemId))

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (products.status === 'Cancelled' || order.orderStatus === 'Delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
        }

        products.status = 'Cancelled';
        await order.save();


        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: item.quantity } }
            );
        }

        res.json({ success: true, message: "Order Cancelled Successfully and Stock Updated" });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};


const loadupdateStatus = async (req, res) => {
    try {
        const orderId = req.query.orderid;
        const itemId = req.query.itemid;

        const order = await Orders.findById(orderId)
            .populate('paymentMethod')
            .populate('items.productId');

        const product = order.items.find(item => item._id.toString() === itemId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found in the order' });
        }

        res.render('editOrderStatus', { order, product });
    } catch (error) {
        console.error('Error Loading Order Status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const updateStatus = async (req, res) => {
    try {
        const { orderid, productStatus, itemid } = req.body;
        console.log(orderid, productStatus, itemid);

        if (productStatus === 'Delivered') {
            const updatedPaymentStatus = await Orders.findOneAndUpdate(
                {
                    _id: orderid
                },
                {
                    $set: {
                        paymentStatus: 'Completed'
                    }
                },
                { new: true, runValidators: true }
            );
        }
        const updatedOrder = await Orders.findOneAndUpdate(
            {
                _id: orderid,
                "items._id": itemid
            },
            {
                $set: {
                    "items.$.status": productStatus
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order or item not found' });
        }

        res.status(200).json({ success: true, message: 'Order status updated successfully', redirectUrl: '/admin/orders' });
    } catch (error) {
        console.error('Error during order status update:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};






module.exports = {
    loadProducts,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    loadOrders,
    cancelOrder,
    loadupdateStatus,
    updateStatus,
}