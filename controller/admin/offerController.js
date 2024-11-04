const Offer = require("../../model/admin/offerModal");
const Product = require("../../model/admin/productModel");
const Category = require("../../model/admin/categoryList");

const loadOffer = async (req, res) => {
  try {
    const [offer, products] = await Promise.all([
      Offer.find({ type: "PRODUCT" }),
      Product.find({ isListed: true }),
    ]);

    res.render("offer", { products, offer });
  } catch (error) {
    console.log("Error Loading Offer:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const addOffer = async (req, res) => {
  try {
    const { title, discount, products, categories, status, type, expiryDate } = req.body;
    console.log(req.body);
    

    if (!title || !discount || !status || !type || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (discount < 0 || discount > 90) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 90",
      });
    }

    const expiryDateObj = new Date(expiryDate);
    if (expiryDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be in the future",
      });
    }

    const cate = await Category.find({_id: categories})


    const newOffer = new Offer({
      title,
      discount,
      type,
      products: products ? products : [],
      categories: cate ? cate : [], 
      status,
      expiryDate,
    });

    await newOffer.save();
   
    let sugu = await Product.updateMany(
      { _id: { $in: products } },  
      { $set: { offerId: newOffer._id } }, 
      { new: true }  
    );
    
    console.log(sugu);
    
    
    let url = "/admin/offer"

    if(categories) url = "/admin/categoryOffer"

    res.status(201).json({
      success: true,
      message: "Offer added successfully",
      redirectUrl: url,
    });
  } catch (error) {
    console.error("Error Adding offer:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const loadCateOffer =async(req,res)=>{
    try {
        const [offer, category] = await Promise.all([
            Offer.find({ type: "CATEGORY" }),
            Category.find({ status: true })
          ]);

        res.render('cateoffers',{category,offer})
    } catch (error) {
        console.log('Error Loading Offer:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const updateOffer = async (req, res) => {

  try {
    const { title, discount, products, expiryDate, status, type, offerId } = req.body;

    const updatedOffer = await Offer.findByIdAndUpdate(
      offerId,
      {
        $set: {
          title,
          discount,
          type,
          products,
          expiryDate,
          status,
        },
      },
      { new: true }
    );

    if (!updatedOffer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Offer updated successfully",
        redirectUrl: "/admin/offer",
      });
  } catch (error) {
    console.log("Error updating offer:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.query.id;
        await Product.updateMany(
          { offerId: offerId },  
          { $unset: { offerId: "" } }   
        );
        
        await Offer.findByIdAndDelete(offerId);

        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ success: false, message: 'Error deleting offer' });
    }
};

module.exports = {
  loadOffer,
  addOffer,
  loadCateOffer,
  updateOffer,
  deleteOffer
};
