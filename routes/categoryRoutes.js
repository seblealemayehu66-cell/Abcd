// routes/categoryRoutes.js
import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

// GET all categories with subcategories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new main category
router.post("/", async (req, res) => {
  const { name } = req.body;
  try {
    const category = new Category({ name, subCategories: [] });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST a subcategory to a main category
router.post("/:categoryId/subcategory", async (req, res) => {
  const { name } = req.body;
  const { categoryId } = req.params;
  try {
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.subCategories.push({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
