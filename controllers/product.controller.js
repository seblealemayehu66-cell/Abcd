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
       sizes,
       colors,
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
      .populate("productId");

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
