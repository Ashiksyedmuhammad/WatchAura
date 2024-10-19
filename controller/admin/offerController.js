const Offer = require('../../model/admin/offerModal');
const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryList');


const loadOffer = async(req,res)=>{
    try {
        const [offer, products] = await Promise.all([
            Offer.find({ type: "PRODUCT" }),
            Products.find({ is_listed: true })
          ]);
          
        res.render('offer',{products,offer})
    } catch (error) {
        
    }
}


const addOffer= async(req,res)=>{

    try {
        const { title, description, discount, products, status, type } = req.body;
        if(type =='PRODUCT'){

       
        const newOffer = new Offer({
            title,
            description,
            discount,
            type,
            products,
            status
        });

        await newOffer.save();
        
        
        res.status(201).json({ success: true, message: 'Offer added successfully' , redirectUrl:'/admin/offers'});
        }else{
            const newOffer = new Offer({
                title,
                description,
                discount,
                type,
                category:products,
                status
            });
    
            await newOffer.save();
    
            res.status(201).json({ success: true, message: 'Offer added successfully' , redirectUrl:'/admin/offers'});
        }
    } catch (error) {
        
    }
}


const editOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, discount, startDate, endDate, applicableId, isActive } = req.body;

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const existingOffer = await Offer.findOne({ name, _id: { $ne: id } });
        if (existingOffer) {
            return res.status(400).json({ success: false, message: 'Offer with this name already exists' });
        }

        offer.name = name;
        offer.type = type;
        offer.discount = discount;
        offer.startDate = startDate;
        offer.endDate = endDate;
        offer.isActive = isActive;

        await offer.save();

        res.status(200).json({ success: true, message: 'Offer updated successfully' });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const deleteOffer = async (req, res) => {
    try {   
        const { id } = req.params;

        const offer = await Offer.findByIdAndDelete(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};
module.exports = {
    loadOffer,
    addOffer,
    editOffer,
    deleteOffer 
}