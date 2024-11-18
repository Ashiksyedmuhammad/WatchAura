const mongoose = require("mongoose");
const Category = require("../../model/admin/categoryList");
const Product = require("../../model/admin/productModel");
const User = require("../../model/user/userModel");
const Cart = require("../../model/user/cart");
const Offer = require("../../model/admin/offerModal");
require("dotenv").config();

const loadCart = async (req, res) => {
  try {
    const userId = req.session.userSession;
    let subTotal = 0;

    const [cart, user] = await Promise.all([
      Cart.findOne({ userId }).populate("items.productId"),
      User.findById(userId),
    ]);

    let productDetails = [];

    if (cart && cart.items) {
      // Get all product IDs and their category IDs
      const productIds = cart.items.map(item => item.productId._id);
      const products = await Product.find({ _id: { $in: productIds } })
        .populate('category')
        .lean();
      
      // Create a map of product ID to category ID
      const productCategoryMap = new Map(
        products.map(product => [product._id.toString(), product.category])
      );

      // Get all relevant offer IDs (both product and category offers)
      const productOfferIds = cart.items
        .map(item => item.productId.offerId)
        .filter(Boolean);
      
      const categoryIds = [...new Set(products.map(product => product.category._id))];

      // Fetch all relevant offers
      const [productOffers, categoryOffers] = await Promise.all([
        Offer.find({ 
          _id: { $in: productOfferIds },
          status: 'active',
          expiryDate: { $gt: new Date() }
        }).lean(),
        Offer.find({ 
          categories: { $in: categoryIds },
          status: 'active',
          expiryDate: { $gt: new Date() }
        }).lean()
      ]);

      // Create maps for quick lookup
      const productOffersMap = new Map(
        productOffers.map(offer => [offer._id.toString(), offer])
      );
      
      const categoryOffersMap = new Map(
        categoryOffers.map(offer => [offer.categories[0].toString(), offer])
      );

      productDetails = await Promise.all(
        cart.items.map(async (item) => {
          const product = item.productId;
          const category = productCategoryMap.get(product._id.toString());
          
          // Check for product-specific offer
          const productOffer = productOffersMap.get(product.offerId?.toString());
          const productDiscount = productOffer?.discount || 0;
          
          // Check for category offer
          const categoryOffer = categoryOffersMap.get(category?._id.toString());
          const categoryDiscount = categoryOffer?.discount || 0;
          
          // Use the better discount
          const bestDiscount = Math.max(productDiscount, categoryDiscount);
          
          return {
            productId: product._id,
            name: product.productName,
            price: product.price,
            offerId: productOffer?._id || categoryOffer?._id,
            discount: bestDiscount,
            originalPrice: product.price,
            discountType: bestDiscount === productDiscount ? 'product' : 'category',
            offerTitle: bestDiscount === productDiscount ? productOffer?.title : categoryOffer?.title
          };
        })
      );

      // Calculate subtotal with the best applicable discount for each item
      cart.items.forEach((cartItem) => {
        const product = cartItem.productId;
        const quantity = cartItem.quantity;
        const productDetail = productDetails.find(
          detail => detail.productId.toString() === product._id.toString()
        );
        
        const effectivePrice = product.price * (1 - (productDetail.discount / 100));
        subTotal += effectivePrice * quantity;
      });
    }

    if (!user) {
      res.render("cart", {
        cart: undefined,
        subTotal,
      });
    } else {
      res.render("cart", {
        cart,
        user,
        subTotal,
        productDetails,
      });
    }
  } catch (error) {
    console.error("Error Loading Cart:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while loading the Cart",
    });
  }
};

const addToCart = async (req, res) => {
  const { productId, quantity, userId } = req.body;

  try {
    let cart = await Cart.findOne({ userId: userId });

    if (cart) {
      const productExists = cart.items.some(
        (item) => item.productId.toString() === productId
      );
      if (productExists) {
        return res
          .status(400)
          .json({ success: false, message: "Product already in cart...!" });
      }

      cart.items.push({ productId, quantity });

      let aaCart = await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Product added to cart...!" });
    } else {
      const newCart = new Cart({
        userId: userId,
        items: [{ productId, quantity }],
      });

      await newCart.save();

      return res
        .status(201)
        .json({ success: true, message: "New Product added to cart...!" });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error...!" });
  }
};

const updateCartQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  const cartId = req.query.cartId;

  try {
    let cart = await Cart.findOne({ _id: cartId })
      .populate('items.productId')
      .populate({
        path: 'items.productId',
        populate: {
          path: 'category'
        }
      });

    if (cart) {
      const productIndex = cart.items.findIndex(
        (item) => item.productId._id.toString() === productId
      );

      if (productIndex > -1) {
        cart.items[productIndex].quantity = quantity;
        await cart.save();

        let subTotal = 0;
        let itemTotal = 0;

        // Fetch all relevant offers
        const productOfferIds = cart.items
          .map(item => item.productId.offerId)
          .filter(Boolean);

        const categoryIds = [...new Set(
          cart.items.map(item => item.productId.category?._id)
        )].filter(Boolean);

        const [productOffers, categoryOffers] = await Promise.all([
          Offer.find({
            _id: { $in: productOfferIds },
            status: 'active',
            expiryDate: { $gt: new Date() }
          }).lean(),
          Offer.find({
            categories: { $in: categoryIds },
            status: 'active',
            expiryDate: { $gt: new Date() }
          }).lean()
        ]);

        // Create maps for quick lookup
        const productOffersMap = new Map(
          productOffers.map(offer => [offer._id.toString(), offer])
        );
        
        const categoryOffersMap = new Map(
          categoryOffers.map(offer => [offer.categories[0].toString(), offer])
        );

        // Calculate totals with offers
        for (const item of cart.items) {
          const product = item.productId;
          const category = product.category;

          // Get product-specific offer
          const productOffer = product.offerId ? 
            productOffersMap.get(product.offerId.toString()) : null;
          const productDiscount = productOffer?.discount || 0;

          // Get category offer
          const categoryOffer = category?._id ? 
            categoryOffersMap.get(category._id.toString()) : null;
          const categoryDiscount = categoryOffer?.discount || 0;

          // Use the better discount
          const bestDiscount = Math.max(productDiscount, categoryDiscount);
          const effectivePrice = product.price * (1 - bestDiscount / 100);

          // Calculate item total if this is the updated item
          if (product._id.toString() === productId) {
            itemTotal = effectivePrice * quantity;
          }

          // Add to subtotal
          subTotal += effectivePrice * item.quantity;
        }

        // Round the totals to 2 decimal places
        itemTotal = Math.round(itemTotal * 100) / 100;
        subTotal = Math.round(subTotal * 100) / 100;

        return res.status(200).json({
          success: true,
          message: "Cart item quantity updated",
          subTotal,
          quantity,
          cart,
          itemTotal,
        });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found in cart" });
      }
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for this user" });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const removeItem = async (req, res) => {
  try {
    const { cartId } = req.query;

    const { productId } = req.body;

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );
    await cart.save();

    const newSubTotal = cart.items.reduce((total, item) => {
      return total + item.productId.price * item.quantity;
    }, 0);

    res.json({ success: true, newSubTotal });
  } catch (error) {
    console.error("Error removing cart item:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while removing the item from the cart",
      });
  }
};
module.exports = {
  loadCart,
  addToCart,
  updateCartQuantity,
  removeItem,
};
