import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";
import cloudinary from "../config/cloudinary.js";


// ✅ ADD PRODUCT (ADMIN CATALOG)
export const addProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    const result = await cloudinary.uploader.upload(req.file.path);

    const product = new Product({
      name,
      price,
      description,
      category,
      stock: stock || 0, // ✅ important
      image: result.secure_url
    });

    await product.save();

    res.json(product);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};



// ✅ GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// ✅ GET BY CATEGORY
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await Product
      .find({ category: categoryId })
      .populate("category");

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// ✅ SELLER PUBLISH PRODUCTS (FIXED 🔥)
export const publishProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { productIds } = req.body;

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ message: "No products selected" });
    }

    const products = await Product.find({
      _id: { $in: productIds }
    });

    const newSellerProducts = [];

    for (let product of products) {

      // ❌ prevent duplicate
      const existing = await SellerProduct.findOne({
        sellerId,
        productId: product._id
      });

      if (existing) continue;

      // ❌ prevent zero stock
      if (!product.stock || product.stock <= 0) continue;

      newSellerProducts.push({
        sellerId,
        productId: product._id,
        price: product.price,
        stock: product.stock // ✅ real stock
      });
    }

    if (newSellerProducts.length === 0) {
      return res.status(400).json({
        message: "No valid products to publish"
      });
    }

    await SellerProduct.insertMany(newSellerProducts);

    res.json({
      message: "Products successfully published to your store"
    });

  } catch (error) {
    console.log("Publish Error:", error);
    res.status(500).json({ message: "Publish failed" });
  }
};



// ✅ GET SELLER PRODUCTS
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const products = await SellerProduct
      .find({ sellerId })
      .populate("productId");

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
