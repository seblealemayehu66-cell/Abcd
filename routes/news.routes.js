import express from "express";
import axios from "axios";
const router = express.Router();

router.get("/news", async (req, res) => {
  try {
    const API_KEY = process.env.NEWS_API_KEY; // safe in backend
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=6&apiKey=${API_KEY}`
    );
    res.json(response.data.articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch news" });
  }
});

export default router;
