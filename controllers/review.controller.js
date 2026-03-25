import Review from "../models/Review.js";
import Product from "../models/Product.js";

export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id; // make sure user auth middleware sets req.user

    if (!productId || !rating) {
      return res.status(400).json({ message: "Product and rating required" });
    }

    const review = new Review({ productId, userId, rating, comment });
    await review.save();

    // Optional: update product rating average
    const reviews = await Review.find({ productId });
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { rating: avgRating });

    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
