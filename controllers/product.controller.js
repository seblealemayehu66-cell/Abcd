import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";
import SellerCart from "../models/SellerCart.js";
import cloudinary from "../config/cloudinary.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { scrapeProduct } from "../utils/scraper.js";
import XLSX from "xlsx";
import fs from "fs-extra";
import path from "path";
import axios from "axios";

// ✅ ADD PRODUCT (ADMIN CATALOG)
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      subcategory,
      stock,
      sizes,
      colors
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    // ✅ Upload all images to Cloudinary
    const uploadedImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products"
      });
      uploadedImages.push(result.secure_url);
    }

    const product = new Product({
      name,
      price,
      description,
      category,
      subcategory,
      sizes: sizes ? JSON.parse(sizes) : [],
      colors: colors ? JSON.parse(colors) : [],
      stock: stock || 0,
      images: uploadedImages // ✅ Save all uploaded images
    });

    await product.save();

    res.json(product);

  } catch (error) {
    console.log("🔥 Add Product Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



// ✅ GET SHOP PRODUCTS BY SHOP NAME
export const getProductsByShopName = async (req, res) => {
  try {
    const { shopName } = req.params;

    if (!shopName) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    // 1. FIND SELLER BY SHOP NAME
    const seller = await User.findOne({
      "shop.name": { $regex: shopName, $options: "i" },
      isSeller: true
    });

    if (!seller) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // 2. GET SELLER PRODUCTS
    const sellerProducts = await SellerProduct.find({
      sellerId: seller._id
    }).populate({
      path: "productId",
      populate: { path: "category" }
    });

    // 3. FORMAT RESPONSE (IMPORTANT FOR FRONTEND)
 // 3. FORMAT RESPONSE (WITH ALL SELLERS)
const products = await Promise.all(
  sellerProducts
    .filter((p) => p.productId)
    .map(async (p) => {

      // Find ALL sellers that published this product
      const allSellers = await SellerProduct.find({
        productId: p.productId._id
      }).populate("sellerId", "name shop");

      return {
        _id: p._id,
        price: p.price,
        stock: p.stock,

        productId: {
          _id: p.productId._id,
          name: p.productId.name,
          images: p.productId.images,
          category: p.productId.category,
          description: p.productId.description
        },

        sellers: allSellers.map((seller) => ({
          sellerId: seller.sellerId._id,
          sellerProductId: seller._id,
          name: seller.sellerId.name,
          shop: seller.sellerId.shop?.name || "",
          price: seller.price,
          stock: seller.stock
        }))
      };
    })
);

    res.json({
      shop: seller.shop,
      sellerId: seller._id,
      products
    });

  } catch (error) {
    console.log("SHOP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔥 BULK IMPORT 50 PRODUCTS


/**
 * BULK IMPORT PRODUCTS
 */
export const bulkImportProducts =
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          message:
            "Excel file required"

        });

      }

      /**
       * READ EXCEL
       */
      const workbook =
        XLSX.readFile(
          req.file.path
        );

      const sheetName =
        workbook.SheetNames[0];

      const data =
        XLSX.utils.sheet_to_json(
          workbook.Sheets[sheetName]
        );

      let insertedProducts = [];

      let failedProducts = [];

      /**
       * LOOP PRODUCTS
       */
      for (const row of data) {

        try {

          /**
           * REQUIRED CHECK
           */
          if (
            !row.name ||
            !row.price
          ) {

            failedProducts.push({

              product:
                row.name ||
                "Unknown",

              reason:
                "Missing name or price"

            });

            continue;

          }

          /**
           * DUPLICATE CHECK
           */
          const existing =
            await Product.findOne({

              name: row.name

            });

          if (existing) {

            failedProducts.push({

              product:
                row.name,

              reason:
                "Product already exists"

            });

            continue;

          }

          /**
           * PRODUCT IMAGES
           */
          let uploadedImages = [];

          if (row.images) {

            const imageUrls =
              String(row.images)
                .split(",")
                .map(url =>
                  url.trim()
                )
                .filter(Boolean);

            /**
             * LOOP IMAGES
             */
            for (const imageUrl of imageUrls) {

              try {

                /**
                 * DOWNLOAD AMAZON IMAGE
                 */
                const response =
                  await axios({

                    url: imageUrl,

                    method: "GET",

                    responseType:
                      "arraybuffer",

                    timeout: 20000,

                    headers: {

                      "User-Agent":
                        "Mozilla/5.0",

                      "Referer":
                        "https://www.amazon.com/"

                    }

                  });

                /**
                 * TEMP FILE
                 */
                const fileName =
                  `temp-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}.jpg`;

                const filePath =
                  path.join(
                    process.cwd(),
                    fileName
                  );

                /**
                 * SAVE FILE
                 */
                await fs.writeFile(
                  filePath,
                  response.data
                );

                /**
                 * UPLOAD TO CLOUDINARY
                 */
                const result =
                  await cloudinary.uploader.upload(
                    filePath,
                    {
                      folder:
                        "products"
                    }
                  );

                uploadedImages.push(
                  result.secure_url
                );

                /**
                 * DELETE TEMP FILE
                 */
                await fs.remove(
                  filePath
                );

              } catch (imgErr) {

                console.log(
                  "IMAGE FAILED:",
                  imageUrl
                );

                console.log(
                  imgErr.message
                );

              }

            }

          }

          /**
           * SIZES
           */
          const sizes =
            row.sizes
              ? String(row.sizes)
                  .split(",")
                  .map(s =>
                    s.trim()
                  )
                  .filter(Boolean)
              : [];

          /**
           * COLOR NAMES
           */
          const colorNames =
            row.colorNames
              ? String(
                  row.colorNames
                )
                  .split(",")
                  .map(c =>
                    c.trim()
                  )
                  .filter(Boolean)
              : [];

          /**
           * COLOR IMAGES
           */
          const colorImages =
            row.colorImages
              ? String(
                  row.colorImages
                )
                  .split(",")
                  .map(i =>
                    i.trim()
                  )
                  .filter(Boolean)
              : [];

          /**
           * COLORS OBJECT
           */
          const colors =
            colorNames.map(
              (color, index) => ({

                name: color,

                image:
                  colorImages[index] ||
                  uploadedImages[index] ||
                  uploadedImages[0] ||
                  ""

              })
            );

          /**
           * CLEAN PRICE
           */
          const cleanPrice =
            Number(
              String(
                row.price
              ).replace(
                /[^0-9.]/g,
                ""
              )
            ) || 0;

          /**
           * CREATE PRODUCT
           */
          const product =
            new Product({

              name:
                row.name,

              price:
                cleanPrice,

              stock:
                Number(
                  row.stock || 0
                ),

              description:
                row.description ||
                "",

              category:
                row.category,

              subcategory:
                row.subcategory ||
                "",

              sizes,

              colors,

              images:
                uploadedImages,

              isPublished: false

            });

          /**
           * SAVE
           */
          await product.save();

          insertedProducts.push(
            product.name
          );

        } catch (err) {

          console.log(err);

          failedProducts.push({

            product:
              row.name ||
              "Unknown",

            reason:
              err.message

          });

        }

      }

      /**
       * DELETE EXCEL
       */
      await fs.remove(
        req.file.path
      );

      /**
       * RESPONSE
       */
      res.json({

        message:
          "Bulk import completed",

        total:
          data.length,

        success:
          insertedProducts.length,

        failed:
          failedProducts.length,

        insertedProducts,

        failedProducts

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Bulk import failed"

      });

    }

  };
// ✅ GET SINGLE PRODUCT
export const getSingleProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id)
      .populate("category");

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // ✅ FIND SELLER PRODUCT
    const sellerProducts = await SellerProduct.find({
  productId: product._id
}).populate("sellerId", "name email shop");

    const orderCount = await Order.countDocuments({
      productId: req.params.id
    });

    const reviews = await Review.find({
      productId: req.params.id
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.json({
      ...product.toObject(),

    sellerProductId: sellerProducts[0]?._id || null,

sellerId: sellerProducts[0]?.sellerId?._id || null,

sellerPrice: sellerProducts[0]?.price || product.price,

sellerStock: sellerProducts[0]?.stock || product.stock,

sellers: sellerProducts.map((sp) => ({
  sellerProductId: sp._id,
  sellerId: sp.sellerId._id,
  name: sp.sellerId.name,
  email: sp.sellerId.email,
  shop: sp.sellerId.shop?.name || "",
  price: sp.price,
  stock: sp.stock,
})),

      orderCount,

      reviews
    });

  } catch (error) {

    console.log("ERROR:", error.message);

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ✅ GET ALL PRODUCTS
// ✅ GET ALL PRODUCTS WITH PAGINATION
// ✅ GET ALL PRODUCTS
export const getProducts = async (req, res) => {try {

const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 35;

const skip = (page - 1) * limit;

const { category, subcategory } = req.query;

let filter = {};

if (category) {
  filter.category = category;
}

if (subcategory) {
  filter.subcategory = subcategory;
}

// ONLY FETCH SMALL AMOUNT
const products = await Product.find(filter)
  .populate("category")
  .skip(skip)
  .limit(limit)
  .lean();

// TOTAL COUNT
const total = await Product.countDocuments(filter);

res.json({
  products,
  total,
  page,
  totalPages: Math.ceil(total / limit)
});

} catch (error) {

console.log(error);

res.status(500).json({
  message: "Server error"
});

}};
// ✅ GET PRODUCTS BY CATEGORY
export const getProductsByCategory = async (req, res) => {
  try {

    const { categoryId } = req.params;

    const {
      subcategory,
      page = 1,
      limit = 40,
      search = "",
    } = req.query;

    let filter = {
      category: categoryId,
    };

    // SUBCATEGORY FILTER
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // SEARCH FILTER
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // TOTAL
    const total = await Product.countDocuments(filter);

    // PRODUCTS
    const products = await Product.find(filter)
      .populate("category")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // SUBCATEGORIES
    const allSubProducts = await Product.find({
      category: categoryId,
    }).select("subcategory");

    const subcategories = [
      ...new Set(
        allSubProducts
          .map((p) => p.subcategory)
          .filter(Boolean)
      ),
    ];

    res.json({
      products,
      subcategories,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// ✅ SELLER PUBLISH PRODUCTS
export const publishCart = async (req, res) => {
  try {
    const seller = req.seller;
    if (!seller) return res.status(401).json({ message: "Seller not authenticated" });

    const sellerId = seller._id;
    const cartItems = await SellerCart.find({ sellerId });
    if (!cartItems.length) return res.status(400).json({ message: "Cart is empty" });

    for (let item of cartItems) {
      if (!item.productId) continue;

      const existing = await SellerProduct.findOne({ sellerId, productId: item.productId });
      if (existing) {
        existing.stock += item.stock || 0;
        existing.price = item.price || existing.price;
        await existing.save();
      } else {
        await SellerProduct.create({
  sellerId: sellerId,

  productId: item.productId,

  price: item.price || 0,

  stock: item.stock || 0
});
      }
    }

    await SellerCart.deleteMany({ sellerId });
    res.json({ message: "Products published successfully" });

  } catch (err) {
    console.error("🔥 Publish Cart Error FULL:", err);
    res.status(500).json({ message: "Server error publishing cart", error: err.message });
  }
};

/* =========================
   GET SINGLE SELLER PRODUCT
========================= */

export const getSellerProductByProduct = async (req, res) => {
  try {

    const { productId } = req.params;

    const sellerProduct =
      await SellerProduct.findOne({
        productId
      })
      .populate("sellerId", "name email shop");

    if (!sellerProduct) {
      return res.status(404).json({
        message: "Seller product not found"
      });
    }

    res.json(sellerProduct);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};


// ✅ GET SELLER PRODUCTS
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const products = await SellerProduct.find({ sellerId })
      .populate({
        path: "productId",
        populate: { path: "category" }
      });

    res.json(products);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
