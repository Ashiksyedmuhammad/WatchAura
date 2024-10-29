const Coupon = require("../../model/admin/coupon");

const loadCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("coupon", { coupons });
  } catch (error) {
    console.error("Error Loading Coupons:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while processing your request",
      });
  }
};

const addCoupon = async (req, res) => {
  try {
    const { couponId, discount, minPurchaseAmount, maxAmount, expiryDate } =
      req.body;

    const newCoupon = new Coupon({
      couponId,
      discount,
      minPurchaseAmount,
      maxAmount,
      expiryDate,
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon Added Successfully",
      redirectUrl: "/admin/coupon",
    });
  } catch (error) {
    console.error("Error adding coupon:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the coupon",
    });
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const updatedData = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      updatedData,
      { new: true }
    );

    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon updated successfully" });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while updating the coupon",
      });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while deleting the coupon",
      });
  }
};

module.exports = {
  loadCoupon,
  addCoupon,
  editCoupon,
  deleteCoupon,
};
