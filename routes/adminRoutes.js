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
const salesController = require('../controller/admin/salesController');


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
adminRoute.post('/approveOrder', adminAuth.isLogin, productController.approveOrder);
adminRoute.post('/rejectOrder', adminAuth.isLogin, productController.rejectOrder);


// COUPONS
adminRoute.get('/coupon', adminAuth.isLogin,couponController.loadCoupon);
adminRoute.post('/add-coupon', adminAuth.isLogin,couponController.addCoupon);
adminRoute.put('/edit-coupon/:id', adminAuth.isLogin, couponController.editCoupon);
adminRoute.delete('/delete-coupon/:id', adminAuth.isLogin, couponController.deleteCoupon);


//OFFERS
adminRoute.get('/offer',adminAuth.isLogin,offerController.loadOffer);
adminRoute.post('/offer/add', adminAuth.isLogin, offerController.addOffer);
adminRoute.get('/categoryOffer', adminAuth.isLogin, offerController.loadCateOffer)
adminRoute.put('/offer/edit/:id',adminAuth.isLogin, offerController.updateOffer);
adminRoute.delete('/delete-offer?:id', adminAuth.isLogin, offerController.deleteOffer);

adminRoute.get('/salesreport', salesController.loadSales);
adminRoute.get('/salesreport/pdf', salesController.downloadPDF);
adminRoute.get('/salesreport/excel', salesController.downloadExcel);

module.exports = adminRoute;