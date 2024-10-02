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










module.exports = adminRoute;