import axios from "axios";
import cheerio from "cheerio";

export const scrapeProduct = async (url) => {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const $ = cheerio.load(data);

  const name =
    $("meta[property='og:title']").attr("content") ||
    $("title").text() ||
    "Product";

  let price =
    $("meta[property='og:price:amount']").attr("content") ||
    $(".product-price-current").text().replace(/[^\d.]/g, "") ||
    10;

  // ✅ IMAGES
  let images = [];
  $("img").each((i, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (
      src &&
      (src.includes("jpg") || src.includes("png")) &&
      !src.includes("icon")
    ) {
      images.push(src.startsWith("//") ? "https:" + src : src);
    }
  });

  images = [...new Set(images)].slice(0, 6);

  // ✅ DESCRIPTION
  const description =
    $("meta[name='description']").attr("content") ||
    `🔥 ${name}
✔ Premium quality
✔ Trending product
📦 Package Includes:
- 1 x ${name}`;

  // ✅ SIZES
  let sizes = [];
  $("span").each((i, el) => {
    const text = $(el).text().trim().toUpperCase();
    if (["XS", "S", "M", "L", "XL", "XXL"].includes(text)) {
      sizes.push(text);
    }
  });
  sizes = [...new Set(sizes)];

  // ✅ COLORS
  let colors = [];
  $("img").each((i, el) => {
    const alt = $(el).attr("alt");
    if (alt && alt.length < 15) {
      colors.push(alt.toLowerCase());
    }
  });
  colors = [...new Set(colors)].slice(0, 6);

  // ✅ SUBCATEGORY
  let subcategory = "General";
  if (name.toLowerCase().includes("shoe")) subcategory = "Shoes";
  if (name.toLowerCase().includes("shirt")) subcategory = "Clothes";
  if (name.toLowerCase().includes("watch")) subcategory = "Electronics";

  return {
    name,
    price: Number(price),
    description,
    images,
    sizes,
    colors,
    subcategory,
    stock: 50
  };
};
