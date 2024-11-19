const Admin = require('../../model/admin/adminModel');
const user = require('../../model/user/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Order = require ('../../model/user/userOrder');

const toLogin = async (req, res) => {
    try {
        let errorMessage = '';
        res.render('adminLogin', { errorMessage })
    } catch (error) {
        console.error('Error while Load, Admin Login Page ', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const checkAdmin = async (req, res) => {

    const { email, password } = req.body;


    try {
        const adminData = await Admin.findOne({ email: email })
        if (!adminData) {
            return res.status(401).render('adminLogin', {

                errorMessage: " Invalid  email or Password"
            });
        }
        const passwordMatch = await bcrypt.compare(password, adminData.password);

        if (passwordMatch) {
            req.session.admin = adminData;
            res.redirect('/admin/dashboard')

        } else {
            return res.status(401).render('adminLogin', {
                errorMessage: 'Invalid email or Password'
            })

        }

    } catch (error) {
        console.error('Error In admin Verification:', error);
        res.status(500).send('Server Error');
    }
}

const adminDashboard = async (req, res) => {
    try {
        const timeFrame = req.query.timeFrame || 'monthly';
        let startDate, endDate = new Date();
        
        
        switch(timeFrame) {
            case 'yearly':
                startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
                break;
            case 'monthly':
                startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
                break;
            case 'weekly':
                startDate = new Date(new Date().setDate(new Date().getDate() - 7));
                break;
            case 'daily':
                startDate = new Date(new Date().setDate(new Date().getDate() - 1));
                break;
            default:
                startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        }

       
        const revenueStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    paymentStatus: 'Completed'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalRevenue: { $sum: "$totalAmount" },
                    ordersCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

       
        const bestSellingProducts = await Order.aggregate([
            { $unwind: "$items" },
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    "items.status": { $nin: ['Cancelled', 'Returned'] }
                }
            },
            {
                $group: {
                    _id: "$items.productId",
                  
                    name: { $first: "$items.name" },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { 
                        $sum: { 
                            $multiply: ["$items.quantity", "$items.price"] 
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    name: 1,  
                    category: "$productDetails.category",
                    totalQuantity: 1,
                    totalRevenue: 1,
                    image: "$productDetails.image"
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        

      
        const bestSellingCategories = await Order.aggregate([
            { $unwind: "$items" },
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    "items.status": { $nin: ['Cancelled', 'Returned'] }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: "$product" },
            {
               
                $lookup: {
                    from: 'categories',
                    localField: 'product.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: "$product.category",
                    categoryName: { $first: "$categoryDetails.categoryName" }, // Get the category name
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: {
                        $sum: { 
                            $multiply: ["$items.quantity", "$items.price"] 
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    categoryName: 1,
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        // Generate ledger data
       

        // Calculate totals for summary cards
        const totalRevenue = revenueStats.reduce((sum, stat) => sum + stat.totalRevenue, 0);
        const totalOrders = revenueStats.reduce((sum, stat) => sum + stat.ordersCount, 0);

        res.render('dashBoard', {
            timeFrame,
            revenueStats: JSON.stringify(revenueStats),
            bestSellingProducts,
            bestSellingCategories,
            summary: {
                totalRevenue,
                totalOrders,
            }
        });

    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard statistics' 
        });
    }
};



const logout = async (req, res) => {
    try {
        delete req.session.admin
        res.redirect('/admin/login')
    } catch (error) {
        console.log('An error Occured while passing Your request', error);
    }
};


const loadCustomer = async (req, res) => {
    try {
        const PAGE_SIZE = 8; 

const page = parseInt(req.query.page) || 1; 8
const skip = (page - 1) * PAGE_SIZE; 

const [users, totalUsers] = await Promise.all([
    user.find({})
        .skip(skip)
        .limit(PAGE_SIZE),
    user.countDocuments({}),
]);

const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

res.render('customers', {
    users,
    currentPage: page,
    totalPages,
});
    } catch (error) {
        console.error('Error while Load, Admin Login Page ', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const blockUser = await user.findById(userId);

        if (!blockUser) {
            return res.redirect('/admin/customers');
        }

        blockUser.isBlocked = true;
        await blockUser.save();

        res.redirect('/admin/customers');

    } catch (error) {
        console.error('Error blocking blockUser:', error);
        res.redirect('/admin/customers');
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const blockUser = await user.findById(userId);

        if (!blockUser) {
            return res.redirect('/admin/customers');
        }

        blockUser.isBlocked = false;
        await blockUser.save();

        res.redirect('/admin/customers');
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.redirect('/admin/customers');
    }
};



module.exports = {
    toLogin,
    checkAdmin,
    adminDashboard,
    logout,
    loadCustomer,
    blockUser,
    unblockUser

}