const Category = require('../../model/admin/categoryList');

const loadCategory = async (req, res) => {
    try {
        const PAGE_SIZE = 10;
        const page = parseInt(req.query.page) || 1; 
        const skip = (page - 1) * PAGE_SIZE; 
        
        const [categoryData, totalCategories] = await Promise.all([
            Category.find({})
                .skip(skip)
                .limit(PAGE_SIZE),
            Category.countDocuments({}),
        ]);
        
        const totalPages = Math.ceil(totalCategories / PAGE_SIZE);
        
        res.render('category', {
            category: categoryData,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error('Error load category:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const addCategory = async (req, res) => {
    try {
        const { categoryName, description, categoryoption } = req.body;


        if (!categoryName || !description || !categoryoption) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }


        if (description.length < 10 || description.length > 200) {
            return res.status(400).json({ success: false, message: 'Description must be between 10 and 200 characters' });
        }

        const title = categoryName.toUpperCase();


        const existingCategory = await Category.findOne({ categoryName: title });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }


        const category = {
            categoryName: title,
            description,
            status: categoryoption === 'true'
        };

        const categoryData = new Category(category);
        await categoryData.save();


        res.status(200).json({ success: true, message: 'Category added successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const editCategory = async (req, res) => {
    try {
        const { categoryName, description, categoryoption } = req.body;

        const { id } = req.params;

        if (!categoryName || !description || !categoryoption) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (description.length < 10 || description.length > 200) {
            return res.status(400).json({ success: false, message: 'Description must be between 10 and 200 characters' });
        }
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const existingCategory = await Category.findOne({ categoryName: categoryName.toUpperCase(), _id: { $ne: id } });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category  already exists' });

        }
        category.categoryName = categoryName.toUpperCase();
        category.description = description;
        category.status = categoryoption === 'true';

        await category.save();


        res.status(200).json({ success: true, message: 'Category updated successfully', redirectUrl: '/admin/category' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};



module.exports = {
    loadCategory,
    addCategory,
    editCategory
}