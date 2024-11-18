const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryList');
const Orders = require('../../model/user/userOrder');
const User = require('../../model/user/userModel')
const sharp = require('sharp');
const path = require('path');
const Coupon = require('../../model/admin/coupon');
const Wallet = require ('../../model/user/userWallet'); 

const loadProducts = async (req, res) => {
    try {
        const PAGE_SIZE = 10;
        const page = parseInt(req.query.page) || 1; 
        const skip = (page - 1) * PAGE_SIZE; 
        
        const [products, categories, totalProducts] = await Promise.all([
            Product.find({})
                .skip(skip)
                .limit(PAGE_SIZE),
            Category.find({}),
            Product.countDocuments({}),
        ]);
        
        const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
        
        res.render('product', {
            products,
            categories,
            currentPage: page,
            totalPages,
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
        const PAGE_SIZE = 10; 
        const page = parseInt(req.query.page) || 1; 
        const skip = (page - 1) * PAGE_SIZE; 
        
        const orders = await Orders.find({})
            .populate('userId items.productId paymentMethod')
            .skip(skip)
            .limit(PAGE_SIZE);
        
        const totalOrders = await Orders.countDocuments({});
        const totalPages = Math.ceil(totalOrders / PAGE_SIZE);
        
        res.render('orders', {
            orders,
            currentPage: page,
            totalPages,
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
const calculateRefundAmount = (order, productToCancel) => {
    let refundAmount =
      parseFloat(productToCancel.price) * productToCancel.quantity;
  
    if (order.couponApplied && order.discountAmount > 0) {
      const orderSubtotal = order.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      const itemPortionOfTotal =
        (productToCancel.price * productToCancel.quantity) / orderSubtotal;
      const itemDiscountPortion = order.discountAmount * itemPortionOfTotal;
      refundAmount -= itemDiscountPortion;
    }
  
    return refundAmount;
  };

const approveOrder = async (req, res) => {
    try {
        const { _id, itemId } = req.body;
        const order = await Orders.findById(_id).populate('paymentMethod').populate('items.productId')
        const products = order.items.find(product => product.equals(itemId))

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }


        products.status = 'Returned';
        await order.save();
        
        const currentItem = order.items;
        const currentTotal = products.price;
        const userId = order.userId;
    
        

        if (products.status = 'Returned') {
            const randomID = Math.floor(100000 + Math.random() * 900000);
            const refundAmount = calculateRefundAmount(order, products);

            

            let wallet = await Wallet.findOne({ userId: userId });
            

             
            
            if (wallet) {
                wallet.balance += refundAmount;
                wallet.history.push({
                    amount: refundAmount,
                    transactionType: "Returned",
                    description: "Product Return Refund",
                    transactionId: `TRX-${randomID}`
                });
            } else {
                wallet = new Wallet({
                    userId: order.userId,
                    balance: refundAmount,
                    history: [{
                        amount: refundAmount,
                        transactionType: "Returned",
                        description: "Product Return Refund",
                        transactionId: `TRX-${randomID}`
                    }]
                });
            }

            await wallet.save({});
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: item.quantity } },
                    { new: true}
                );
            }
        }
         

        
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: item.quantity } }
            );
        }

        res.json({ success: true, message: "Request Approved Successfully ..." });
    } catch (error) {
        console.error('Error Approving order:', error);
        res.status(500).json({ success: false, message: 'Failed to Approve order' });
    }
};

const rejectOrder = async (req, res) => {
    try {
        const { _id, itemId } = req.body;
        const order = await Orders.findById(_id).populate('paymentMethod').populate('items.productId')
        const products = order.items.find(product => product.equals(itemId))

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        products.status = 'Return Rejected';
        await order.save();


       

        res.json({ success: true, message: "Request Rejected..." });
    } catch (error) {
        console.error('Error Rejecting order:', error);
        res.status(500).json({ success: false, message: 'Failed to Reject order' });
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
    approveOrder,
    rejectOrder
}