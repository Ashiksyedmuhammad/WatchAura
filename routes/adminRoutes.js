const express = require('express');
const session = require('express-session');
const adminRoute = express();
const path = require("path");
const adminController = require('../controller/admin/adminController')
const categoryController = require('../controller/admin/categoryController');
const productController = require('../controller/admin/productController');
const upload = require('../middleware/multerConfig');
const adminAuth = require('../middleware/adminAuth');
const config = require('../config/config');
const couponController = require('../controller/admin/couponController');
const offerController = require('../controller/admin/offerController');


adminRoute.use(session({
    secret: config.sessionSecret,
    resave: false,
    rolling: false,
    saveUninitialized: true
}))

adminRoute.set('views', './views/admin');

adminRoute.get('/', (req, res) => {
    res.redirect('admin/login')
})

// LOGIN OR LOGOUT
adminRoute.get('/login', adminAuth.isLogout, adminController.toLogin);
adminRoute.post('/login', adminAuth.isLogout, adminController.checkAdmin);
adminRoute.get('/dashboard', adminAuth.isLogin, adminController.adminDashboard);
adminRoute.post('/logout', adminController.logout);


// CUSTOMERS 
adminRoute.get('/customers', adminAuth.isLogin, adminController.loadCustomer);
adminRoute.post('/block/:id', adminAuth.isLogin, adminController.blockUser);
adminRoute.post('/unblock/:id', adminAuth.isLogin, adminController.unblockUser);


// CATEGORIES
adminRoute.get('/category', adminAuth.isLogin, categoryController.loadCategory);
adminRoute.post('/category/add', adminAuth.isLogin, categoryController.addCategory);
adminRoute.put('/category/edit/:id', adminAuth.isLogin, categoryController.editCategory);


// PRODUCT
adminRoute.get('/product', adminAuth.isLogin, productController.loadProducts);
adminRoute.get('/product/addProduct', adminAuth.isLogin, productController.loadAddProduct);
adminRoute.post('/product/addProduct', adminAuth.isLogin, upload.upload.fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 }
]), productController.addProduct);
adminRoute.get('/product/edit/:id', adminAuth.isLogin, productController.loadEditProduct);
adminRoute.post('/product/editProduct/:id', adminAuth.isLogin,
    upload.upload.fields([
        { name: 'productImage1', maxCount: 1 },
        { name: 'productImage2', maxCount: 1 },
        { name: 'productImage3', maxCount: 1 }
    ]), productController.editProduct);


//orders
adminRoute.get('/orders', adminAuth.isLogin, productController.loadOrders);
adminRoute.post('/cancelOrder', adminAuth.isLogin, productController.cancelOrder);
adminRoute.get('/updateStatus', adminAuth.isLogin, productController.loadupdateStatus);
adminRoute.post('/updateStatus', adminAuth.isLogin, productController.updateStatus);


// COUPONS

adminRoute.get('/coupon', couponController.loadCoupon);
adminRoute.post('/add-coupon', couponController.addCoupon);
adminRoute.put('/edit-coupon/:id', couponController.editCoupon);
adminRoute.delete('/delete-coupon/:id', couponController.deleteCoupon);


//OFFERS
adminRoute.get('/offer',offerController.loadOffer);
adminRoute.post('/offer/add', offerController.addOffer);
adminRoute.put('/offer/edit/:id', offerController.editOffer);
adminRoute.delete('/offer/delete/:id', offerController.deleteOffer);

module.exports = adminRoute;