const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryList');
const sharp = require('sharp');
const path = require('path');

const loadProducts = async (req, res) => {
    try {
        const [products, categories] = await Promise.all([
            Product.find({}),
            Category.find({}),
        ]);
        res.render('product', {
            products,
            categories
        });
    } catch (error) {
        console.error('Error Loading Products:', error);

        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const loadAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.render('addProduct', {
            categories
        });
    } catch (error) {
        console.error('Error Loading Add Product Page:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const addProduct = async (req, res) => {
    try {
        // Ensure req.files is an object
        if (!req.files || typeof req.files !== 'object') {
            throw new Error('No files uploaded or incorrect file format');
        }

        // Process each file field asynchronously
        const imageFields = Object.values(req.files);
        const imagePromises = imageFields.flat().map(async (file) => {
            // console.log('File Object:', file);

            // Check if file.path and file.filename are defined
            if (!file.path || !file.filename) {
                console.error('Error: file.path or file.filename is undefined');
                return null; // Or handle this case appropriately
            }

            // Define the paths for Sharp
            const imagePath = path.resolve(file.path); // Ensure this is a valid absolute path
            const outputImagePath = path.join(__dirname, '../../uploads/cropped', file.filename);
            // console.log('Image Path:', imagePath);
            // console.log('Output Image Path:', outputImagePath);

            try {
                // Resize and save the image using Sharp
                await sharp(imagePath)
                    .resize(200, 200)
                    .toFile(outputImagePath);

                // console.log('Image cropped successfully:', outputImagePath);
                return file.filename;
            } catch (err) {
                console.error('Error cropping image:', err);
                return null; // Or handle the error case appropriately
            }
        });

        // Wait for all image processing to complete
        const imageResults = await Promise.all(imagePromises);
        const images = imageResults.filter(filename => filename); // Filter out null results

        // Create and save the product
        const productData = {
            productName: req.body['productTitle'],
            description: req.body['ProductDescription'],
            price: parseFloat(req.body['productPrice']),
            category: req.body['categorySelection'],
            stock: parseInt(req.body['productCount']),
            isListed: req.body['productOption'],
            images: images
        };

        const newProduct = new Product(productData);
        await newProduct.save();

        res.status(200).json({ success: true, message: 'Product added successfully!', red: '/admin/product' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'Error adding product: ' + error.message });
    }
};


const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const [product, categories] = await Promise.all([
            Product.findById(productId),
            Category.find({})
        ]);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.render('editProduct', {
            product,
            categories
        });
    } catch (error) {
        console.error('Error Loading Edit Product Page:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};


const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = {
            productName: req.body.productTitle,
            description: req.body.ProductDescription,
            price: parseFloat(req.body.productPrice),
            category: req.body.categorySelection,
            stock: parseInt(req.body.productCount),
            isListed: req.body.productOption === 'true'
        };

        const imageFiles = req.files;
        const images = [];

        // Process each uploaded file
        for (let i = 1; i <= 3; i++) {
            const fieldName = `productImage${i}`;
            if (imageFiles[fieldName] && imageFiles[fieldName][0]) {
                images.push(imageFiles[fieldName][0].filename);
            } else {

                const existingImageField = `existingImage${i}`;
                if (req.body[existingImageField]) {
                    images.push(req.body[existingImageField]);
                }
            }
        }

        updatedData.images = images

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, message: 'Product edited successfully!', redirect: '/admin/product' });
    } catch (error) {
        console.error('Error edited product:', error);
        res.status(500).json({ success: false, message: 'Error editing product: ' + error.message });
    }
};



module.exports = {
    loadProducts,
    loadAddProduct,
    addProduct,
    loadEditProduct,
    editProduct
}