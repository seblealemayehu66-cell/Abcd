import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";
import cloudinary from "../config/cloudinary.js";


// ADD PRODUCT (ADMIN CATALOG)
export const addProduct = async (req, res) => {

  try {

    const { name, price, description, category,stock } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    const result = await cloudinary.uploader.upload(req.file.path);

    const product = new Product({
      name,
      price,
      description,
      category,
      image: result.secure_url
    });

    await product.save();

    res.json(product);

  } catch (error) {

    console.log(error);
    res.status(500).json({ message: "Server Error" });

  }

};



// GET ALL CATALOG PRODUCTS
export const getProducts = async (req, res) => {

  try {

    const products = await Product.find().populate("category");

    res.json(products);

  } catch (error) {

    res.status(500).json({ message: "Server error" });

  }

};



// GET PRODUCTS BY CATEGORY
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



// SELLER BATCH PUBLISH PRODUCTS
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

    const sellerProducts = products.map((product) => ({
      sellerId,
      productId: product._id,
      price: product.price,
      stock: product.stock || 10
    }));

    await SellerProduct.insertMany(sellerProducts);

    res.json({
      message: "Products successfully published to your store"
    });

  } catch (error) {

    console.log("Publish Error:", error);

    res.status(500).json({
      message: "Publish failed"
    });

  }

};



// GET SELLER STORE PRODUCTS
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
