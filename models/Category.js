// models/Category.js
import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  subCategories: [subCategorySchema], // array of subcategories
});

export default mongoose.model("Category", categorySchema);
