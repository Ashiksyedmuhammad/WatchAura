const mongoose = require("mongoose");
const User = require("../../model/user/userModel");
const Product = require("../../model/admin/productModel");
const Address = require("../../model/user/userAddress");
const bcrypt = require("bcrypt");
const Order = require("../../model/user/userOrder");
const Wishlist = require("../../model/user/userWishList");
const Wallet = require("../../model/user/userWallet");
const Return = require("../../model/user/userReturnReq");
const PDFDocument = require("pdfkit");
const Offer = require("../../model/admin/offerModal");
const fs = require("fs");

const loadDashboard = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("dashBoard", {
      userData: user,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Internal server error");
  }
};

const loadAddressPage = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const user = await User.findById(userId);
    const address = await Address.find({ userId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("address", {
      userData: user,
      address,
    });
  } catch (error) {
    console.error("Error loading address page:", error);
    res.status(500).send("Internal server error");
  }
};

const addAddress = async (req, res) => {
  try {
    const { first_name, last_name, address, city, state, postal_code, phone } =
      req.body;

    if (
      !first_name ||
      !last_name ||
      !address ||
      !city ||
      !postal_code ||
      !state
    ) {
      return res.status(400).json({ error: "Missing Required Fields" });
    }
    const existingAddress = await Address.findOne({
      address: address,
    });

    if (existingAddress) {
      return res
        .status(400)
        .json({ error: "Address already exists and cannot be used" });
    }

    const newAddress = {
      firstName: first_name,
      lastName: last_name,
      address,
      city,
      state,
      postal_code,
      phone,
      userId: req.session.userSession,
    };

    const savedAddress = await Address.create(newAddress);

    res
      .status(201)
      .json({ message: "Address saved successfully", address: savedAddress });
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAddress = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.session.userSession });

    if (addresses.length === 0) {
      return res.status(200).json({ message: "No Address Available" });
    }

    res.status(200).json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const editAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, address, city, state, postal_code, phone } =
      req.body;

    if (
      !firstName ||
      !lastName ||
      !address ||
      !city ||
      !postal_code ||
      !state
    ) {
      return res.status(400).json({ error: "Missing Required Fields" });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        firstName: firstName,
        lastName: lastName,
        address,
        city,
        state,
        postal_code,
        phone,
      },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Address updated successfully",
        address: updatedAddress,
      });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAddress = await Address.findByIdAndDelete(id);

    if (!deletedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const loadAccount = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const user = await User.findById(userId);
    res.render("account", { userData: user });
  } catch (error) {
    console.error("Error load account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateUserData = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const { name, currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    try {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    } catch (bcryptError) {
      console.error("bcrypt.compare error:", bcryptError);
      return res.json({ success: false, message: "Error verifying password" });
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return res.json({
          success: false,
          message: "New password must be at least 8 characters long",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.json({
          success: false,
          message: "New passwords do not match",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.findByIdAndUpdate(userId, {
        firstName: name,
        password: hashedPassword,
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        firstName: name,
      });
    }

    res.json({
      success: true,
      message: "User information updated successfully",
    });
  } catch (error) {
    console.error("Error updating account details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const loadOrder = async (req, res) => {
  try {
    const PAGE_SIZE = 10; // number of orders to display per page

const userId = req.session.userSession;
const user = await User.findById(userId);

const page = parseInt(req.query.page) || 1; // get the current page number from the query string, or default to 1
const skip = (page - 1) * PAGE_SIZE; // calculate the number of orders to skip based on the current page

const order = await Order.find({ userId })
  .populate("items.productId")
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(PAGE_SIZE);

const totalOrders = await Order.countDocuments({ userId });
const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

res.render("orderList", {
  userData: user,
  order,
  currentPage: page,
  totalPages,
});
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Internal server error");
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const user = await User.findById(userId);
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, userId }).populate(
      "items.productId"
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("orderDetails", {
      userData: user,
      order,
    });
  } catch (error) {
    console.error("Error loading order details:", error);
    res.status(500).send("Internal server error");
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

const cancelOrder = async (req, res) => {
  try {
    const { _id, cancel_reason, item_id } = req.body;

    const order = await Order.findById(_id).populate("items.productId");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const productToCancel = order.items.find((product) =>
      product._id.equals(item_id)
    );

    if (!productToCancel) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in order" });
    }

    if (
      order.paymentMethod == "RAZORPAY" &&
      order.paymentStatus == "Completed"
    ) {
      const randomID = Math.floor(100000 + Math.random() * 900000);

      const refundAmount = calculateRefundAmount(order, productToCancel);

      let wallet = await Wallet.findOne({ userId: req.session.userSession });

      if (wallet) {
        wallet.balance += refundAmount;
        wallet.history.push({
          amount: refundAmount,
          transactionType: "Cancelled",
          description: `Product Cancelled Refund (Including Discounts)`,
          transactionId: `TRX-${randomID}`,
        });
      } else {
        wallet = new Wallet({
          userId: req.session.userSession,
          balance: refundAmount,
          history: [
            {
              amount: refundAmount,
              transactionType: "Cancelled",
              description: `Product Cancelling Refund (Including Discounts)`,
              transactionId: `TRX-${randomID}`,
            },
          ],
        });
      }

      await wallet.save();

      productToCancel.status = "Cancelled";
      productToCancel.cancellationReason = cancel_reason;
      await order.save();
    } else {
      productToCancel.status = "Cancelled";
      productToCancel.cancellationReason = cancel_reason;
      await order.save();
    }

    await Product.findByIdAndUpdate(
      productToCancel.productId,
      { $inc: { stock: productToCancel.quantity } },
      { new: true }
    );

    await order.save();

    res.json({
      success: true,
      message: "Order item cancelled successfully and stock updated",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};

const returnOrder = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const orderId = req.params.id;
    const itemId = req.body.itemId;
    const return_reason = req.body.return_reason;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const products = order.items.find((product) => product._id.equals(itemId));
    if (products.status !== "Delivered") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only delivered orders can be returned",
        });

    }
 


    const refundAmount = calculateRefundAmount(order, products);

    const returnRequest = new Return({
      itemId: itemId,
      orderId: orderId,
      userId: userId,
      reason: return_reason,
      status: "Pending",
      refundAmount: refundAmount,
    });

    await returnRequest.save();

    products.status = "Return Requested";
    if(products.price<1000){
      return res.status(400).json({
        success:true,
        message:"Sorry You are not eligible to Return this Product"
      });
    }
    await order.save();

    res.json({
      success: true,
      message: "Return request submitted successfully",
    });
  } catch (error) {
    console.error("Error processing return request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const loadOrderSummary = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const user = await User.findById(userId)
    
    
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate(
      "items.productId userId"
    );
    if (!order) {
      return res.status(404).send("Order Not Found");
    }
    res.render("orderSummary", { order ,userData:user});
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).send("Order ID is required");
    }

    const order = await Order.findById(orderId).populate("items.productId");

    if (!order) {
      console.log("Order not found in database");
      return res.status(404).send("Order not found");
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=WatchAura-Invoice-${orderId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text("WatchAura", { align: "right" });
    doc.moveDown();

    doc.fontSize(18).text("Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Invoice Number: INV-${order._id.toString().slice(-6)}`, {
      align: "left",
    });
    doc.text(`Order ID: ${order._id}`, { align: "left" });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, {
      align: "left",
    });
    doc.moveDown();

    doc.text("Ship to:", { align: "left" });
    doc.text(
      `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      { align: "left" }
    );
    doc.text(`${order.shippingAddress.address}`, { align: "left" });
    doc.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postal_code}`,
      { align: "left" }
    );
    doc.text(`Phone: ${order.shippingAddress.phone}`, { align: "left" });
    doc.moveDown();

    const table = {
      headers: ["Product", "Quantity", "Price", "Total"],
      rows: [],
    };

    order.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      table.rows.push([
        item.name,
        item.quantity.toString(),
        `${item.price.toFixed(2)}`,
        `${itemTotal.toFixed(2)}`,
      ]);
    });

    const startX = 50;
    const startY = 300;
    const rowHeight = 30;
    const colWidth = (doc.page.width - 100) / 4;

    doc.font("Helvetica-Bold");
    table.headers.forEach((header, i) => {
      doc.text(header, startX + i * colWidth, startY, {
        width: colWidth,
        align: "left",
      });
    });

    doc.font("Helvetica");
    table.rows.forEach((row, i) => {
      const y = startY + (i + 1) * rowHeight;
      row.forEach((cell, j) => {
        doc.text(cell, startX + j * colWidth, y, {
          width: colWidth,
          align: "left",
        });
      });
    });

    const subtotal = order.totalAmount;

    doc.moveDown();
    doc.font("Helvetica");
    doc.text(`Subtotal: ${subtotal+order.discountAmount}`, { align: "right" });

    if (order.discountAmount > 0) {
      doc.text(`Discount: -${order.discountAmount.toFixed(2)}`, {
        align: "right",
      });
    }

    doc.font("Helvetica-Bold");
    doc.text(`Total Amount: ${order.totalAmount.toFixed(2)}`, {
      align: "right",
    });

    doc.moveDown();
    doc.font("Helvetica");
    doc.text(`Payment Method: ${order.paymentMethod}`, { align: "right" });
    doc.text(`Payment Status: ${order.paymentStatus}`, { align: "right" });

    doc.moveDown();
    doc
      .fontSize(8)
      .text("Thank you for shopping with WatchAura!", { align: "center" });

    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating invoice");
  }
};

const loadWishlist = async (req, res) => {
  try {
    let userData;
   
    if (req.session.userSession) {
      userData = await User.findById(req.session.userSession);
    }

    if (userData) {
      const userId = userData._id;

      
      const wishlistItems = await Wishlist.find({ userId: userId })
        .populate({
          path: 'items.productId',
          populate: {
            path: 'category' 
          }
        });

      
      const offers = await Offer.find({
        status: 'active',
        $or: [
          { type: 'PRODUCT' },
          { type: 'CATEGORY' }
        ]
      }).populate('products').populate('categories');

      res.render("wishList", { 
        userData, 
        wishlist: wishlistItems, 
        userId,
        offers,
        calculateBestOffer 
      });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error loading wishlist:", error);
    res.status(500).render("error", { message: "Failed to load wishlist" });
  }
};


function calculateBestOffer(product, offers) {
  if (!product || !offers) return { hasDiscount: false, bestDiscount: 0, discountedPrice: product?.price || 0 };
  
  let bestDiscount = 0;
  let hasDiscount = false;
  let discountedPrice = product.price;
  
  // Check product-specific offers
  const productOffers = offers.filter(offer => 
    offer.status === 'active' && 
    offer.type === 'PRODUCT' &&
    offer.products.some(p => String(p._id) === String(product._id))
  );

  productOffers.forEach(offer => {
    if (offer.discount > bestDiscount) {
      bestDiscount = offer.discount;
      hasDiscount = true;
      discountedPrice = product.price * (1 - bestDiscount / 100);
    }
  });

  // Check category offers
  const categoryOffers = offers.filter(offer => 
    offer.status === 'active' && 
    offer.type === 'CATEGORY' &&
    offer.categories.some(cat => String(cat._id) === String(product.category._id))
  );

  categoryOffers.forEach(offer => {
    if (offer.discount > bestDiscount) {
      bestDiscount = offer.discount;
      hasDiscount = true;
      discountedPrice = product.price * (1 - bestDiscount / 100);
    }
  });

  return {
    hasDiscount,
    bestDiscount,
    discountedPrice: Math.round(discountedPrice * 100) / 100
  };
}








const addWishlistItem = async (req, res) => {
  console.log("aaa");

  const { userId, productId, quantity } = req.body;

  try {
    let wishlistItem = await Wishlist.findOne({ userId });

    console.log(wishlistItem);

    if (wishlistItem) {
      const productExists = wishlistItem.items.some(
        (item) => item.productId.toString() === productId
      );
      if (productExists) {
        return res
          .status(400)
          .json({ success: false, message: "Product already in wishlist...!" });
      }

      console.log(productExists);

      wishlistItem.items.push({ productId });

      await wishlistItem.save();
      return res
        .status(200)
        .json({ success: true, message: "Product added to Wishlist...!" });
    } else {
      const newWishlist = new Wishlist({
        userId: userId,
        items: [{ productId }],
      });
      await newWishlist.save();
    }

    return res
      .status(201)
      .json({ success: true, message: "New Product added to WishList...!" });
  } catch (error) {
    console.log("Error Adding Wishlist Item:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

const removeWishlistItem = async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userSession;

  try {
    const result = await Wishlist.updateOne(
      { userId: userId },
      { $pull: { items: { productId: productId } } }
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Product removed from wishlist successfully!",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist",
    });
  }
};

const loadWallet = async (req, res) => {
  try {
    const userId = req.session.userSession;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }
    const wallet = await Wallet.findOne({ userId: userId });
    if (!wallet) {
      const newWallet = new Wallet({
        userId: userId,
        balance: 0,
        history: [],
      });
      await newWallet.save();

      res.render("wallet", {
        userData: user,
        wallet: newWallet,
      });
    } else {
      res.render("wallet", {
        userData: user,
        wallet: wallet,
      });
    }
  } catch (error) {
    console.error("Error loading Wallet:", error);
    res.status(500).send("Internal server error");
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
  loadOrderSummary,
  loadWishlist,
  addWishlistItem,
  removeWishlistItem,
  loadWallet,
  calculateRefundAmount,
  downloadInvoice,
};
