import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function getCategoryAttributeFromCategory(category) {
  const map = {
    "Candies and Jellies": "candiesandjellies",
    Chinese: "chinese",
    "Chocolate Gifts": "chocolate_gifts",
    Dates: "dates",
    "Raw Nuts": "raw_nuts",
    "Roasted Nuts": "roasted_nuts",
    "Dried Fruits": "driedfruits",
    Seeds: "seeds",
  };
  return map[category] || null;
}

router.get("/item/:name_of_the_category/:title", async (req, res) => {
  const name_of_the_category = decodeURIComponent(
    req.params.name_of_the_category
  );
  let title = decodeURIComponent(req.params.title);

  try {
    let categoryAttribute = getCategoryAttributeFromCategory(name_of_the_category);

    if (!categoryAttribute && title === "Coffee") {
      categoryAttribute = "coffee";
      title="500 g Coffee Bag";
    }
    else if (!categoryAttribute && title!=="Coffee") {
      return res.status(400).json({ error: "Invalid category" });
    }
    console.log("hello");

    let { data, error } = await supabase
    .from("Categories")
    .select("Categories_id")
    .eq("name", categoryAttribute)
    .single();

    if (error || !data) {
      console.error("Category fetch error:", error);
      return res.status(404).json({ error: "Category not found" });
    }

    const categoryId = data.Categories_id;
    
    let result= await supabase
    .from("Roastery_Products")
    .select("*")
    .eq("Categories_id", categoryId)
    .eq("Product_name", title)
    .single();
    data=result.data;
    error=result.error;

    if (error || !data) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/someEndpoint", async (req, res) => {
  const { title, totalWeight, totalPrice, email2, nameOfTheUser } = req.query;

  try {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          email: email2,
          product: title,
          totalweight: parseFloat(totalWeight),
          totalprice: parseFloat(totalPrice),
          nameoftheuser: nameOfTheUser,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: "Product stored successfully in Supabase",
      inserted: data,
    });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

export default router;
