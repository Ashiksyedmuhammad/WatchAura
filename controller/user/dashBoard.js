const mongoose = require('mongoose');
const User = require('../../model/user/userModel');
const Product = require('../../model/admin/productModel');
const Address = require('../../model/user/userAddress');
const bcrypt = require('bcrypt');
const Order = require('../../model/user/userOrder');




const loadDashboard = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found')
        }
        res.render('dashBoard', {
            userData: user
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Internal server error');
    }
};

const loadAddressPage = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        const address = await Address.find({ userId })

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('address', {
            userData: user,
            address
        });
    } catch (error) {
        console.error('Error loading address page:', error);
        res.status(500).send('Internal server error');
    }
};

const addAddress = async (req, res) => {
    try {
        const { first_name, last_name, address, city, state, postal_code, phone } = req.body;

        if (!first_name || !last_name || !address || !city || !postal_code || !state) {

            return res.status(400).json({ error: 'Missing Required Fields' });
        }
        const existingAddress = await Address.findOne({
            address: address
        });

        if (existingAddress) {

            return res.status(400).json({ error: 'Address already exists and cannot be used' });
        }


        const newAddress = {
            firstName: first_name,
            lastName: last_name,
            address,
            city,
            state,
            postal_code,
            phone,
            userId: req.session.userSession
        };

        
        const savedAddress = await Address.create(newAddress);

        res.status(201).json({ message: 'Address saved successfully', address: savedAddress });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getAddress = async (req, res) => {
    try {

        const addresses = await Address.find({ userId: req.session.userSession });

        if (addresses.length === 0) {
            return res.status(200).json({ message: 'No Address Available' });
        }

        res.status(200).json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const editAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, address, city, state, postal_code, phone } = req.body;


        if (!firstName || !lastName || !address || !city || !postal_code || !state) {
            return res.status(400).json({ error: 'Missing Required Fields' });
        }


        const updatedAddress = await Address.findByIdAndUpdate(
            id,
            { firstName: firstName, lastName: lastName, address, city, state, postal_code, phone },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ success: true, message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedAddress = await Address.findByIdAndDelete(id);

        if (!deletedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadAccount = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        res.render('account', { userData: user });
    } catch (error) {
        console.error('Error load account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updateUserData = async (req, res) => {
    try {
        const userId = req.session.userSession;  // Retrieve user ID from session
        const { name, currentPassword, newPassword, confirmPassword } = req.body;  

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        
        try {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.json({ success: false, message: 'Current password is incorrect' });
            }
        } catch (bcryptError) {
            console.error('bcrypt.compare error:', bcryptError);
            return res.json({ success: false, message: 'Error verifying password' });
        }

        
        if (newPassword) {
            if (newPassword.length < 8) {
                return res.json({ success: false, message: 'New password must be at least 8 characters long' });
            }

           
            if (newPassword !== confirmPassword) {
                return res.json({ success: false, message: 'New passwords do not match' });
            }

            
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            
            await User.findByIdAndUpdate(userId, {
                firstName: name, 
                password: hashedPassword  
            });
        } else {
           
            await User.findByIdAndUpdate(userId, {
                firstName: name  
            });
        }

        res.json({ success: true, message: 'User information updated successfully' });
    } catch (error) {
        console.error('Error updating account details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadOrder = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        const order = await Order.find({userId}).populate("items.productId");
        if (!user) {
            return res.status(404).send('User not found')
        }
        res.render('orderList', {
            userData: user,
            order
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Internal server error');
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const user = await User.findById(userId);
        const orderId = req.params.id;
        const order = await Order.findOne({ _id: orderId, userId }).populate("items.productId");

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('orderDetails', { 
            userData: user,
            order 
        });
    } catch (error) {
        console.error('Error loading order details:', error);
        res.status(500).send('Internal server error');
    }
};



const returnOrder = async (req, res) => {
    try {
        const userId = req.session.userSession;
        const orderId = req.params.id;
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.orderStatus.toLowerCase() !== 'placed') {
            return res.status(400).json({ success: false, message: 'Order cannot be returned at this stage' });
        }

        order.orderStatus = 'Return Requested';
        await order.save();

        res.json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { _id, cancel_reason, item_id } = req.body;

        const order = await Order.findById(_id)
            .populate('paymentMethod')
            .populate('items.productId');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const productToCancel = order.items.find(product => product._id.equals(item_id));
        
        if (!productToCancel) {
            return res.status(404).json({ success: false, message: 'Product not found in order' });
        }

        productToCancel.status = 'Cancelled';
        productToCancel.cancellationReason = cancel_reason;

        await Product.findByIdAndUpdate(
            productToCancel.productId,
            { $inc: { stock: productToCancel.quantity } },
            { new: true }
        );

        await order.save();

        res.json({ success: true, message: "Order item cancelled successfully and stock updated" });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};

const loadOrderSummary = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate("items.productId");
        if (!order) {
            return res.status(404).send('Order Not Found');
        }
        res.render('orderSummary', { order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


module.exports = {
    loadDashboard,
    loadAddressPage,
    addAddress,
    getAddress,
    editAddress,
    deleteAddress,
    loadAccount,
    updateUserData,
    loadOrder,
    getOrderDetails,
    cancelOrder,
    returnOrder,
    loadOrderSummary
}