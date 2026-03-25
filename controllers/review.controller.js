import Review from "../models/Review.js";
import Product from "../models/Product.js";

// Add review
export const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment required" });
    }

    const review = await Review.create({
      productId,
      userId: req.user._id, // from protect middleware
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
