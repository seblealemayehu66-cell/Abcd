import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";
import SellerCart from "../models/SellerCart.js"; // ✅ FIXED (you forgot this)
import cloudinary from "../config/cloudinary.js";


// ✅ ADD PRODUCT (ADMIN CATALOG)
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      subcategory, // ✅ NEW
      stock,
      sizes,
      colors
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    const result = await cloudinary.uploader.upload(req.file.path);

    const product = new Product({
      name,
      price,
      description,
      category,
      subcategory, // ✅ SAVE IT
      sizes: sizes ? JSON.parse(sizes) : [],
      colors: colors ? JSON.parse(colors) : [],
      stock: stock || 0,
      image: result.secure_url
    });

    await product.save();

    res.json(product);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};


// ✅ GET SINGLE PRODUCT
export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ GET ALL PRODUCTS (WITH FILTER 🔥)
export const getProducts = async (req, res) => {
  try {
    const { category, subcategory } = req.query;

    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    const products = await Product.find(filter).populate("category");

    res.json(products);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ GET BY CATEGORY (WITH SUBCATEGORY FILTER 🔥)
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subcategory } = req.query;

    let filter = { category: categoryId };

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    const products = await Product
      .find(filter)
      .populate("category");

    res.json(products);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ SELLER PUBLISH PRODUCTS
export const publishCart = async (req, res) => {
  try {
    const seller = req.seller;

    if (!seller) {
      return res.status(401).json({ message: "Seller not authenticated" });
    }

    const sellerId = seller._id;

    const cartItems = await SellerCart.find({ sellerId });

    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    for (let item of cartItems) {
      if (!item.productId) continue;

      const existing = await SellerProduct.findOne({
        sellerId,
        productId: item.productId,
      });

      if (existing) {
        existing.stock += item.stock || 0;
        existing.price = item.price || existing.price;
        await existing.save();
      } else {
        await SellerProduct.create({
          sellerId,
          productId: item.productId,
          price: item.price || 0,
          stock: item.stock || 0,
        });
      }
    }

    await SellerCart.deleteMany({ sellerId });

    res.json({ message: "Products published successfully" });

  } catch (err) {
    console.error("🔥 Publish Cart Error FULL:", err);
    res.status(500).json({
      message: "Server error publishing cart",
      error: err.message,
    });
  }
};


// ✅ GET SELLER PRODUCTS
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const products = await SellerProduct
      .find({ sellerId })
      .populate({
        path: "productId",
        populate: { path: "category" } // ✅ optional deep populate
      });

    res.json(products);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
