import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function getCategoryNameAttribute(category) {
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
  console.log("The name of the category is: "+name_of_the_category);
  const title = decodeURIComponent(req.params.title);

  try {
    let categoryNameAttribute = getCategoryName(name_of_the_category);

    if (!categoryNameAttribute && title === "Coffee") {
      categoryNameAttribute = "coffee";
    }

    if (!categoryNameAttribute) {
      return res.status(400).json({ error: "Invalid category" });
    }

    let data, error;

    if (title === "Coffee") {
      ({ data, error } = await supabase.from(tableName).select("*").single());
    } else {
      ({ data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("name_of_product", title)
        .single());
    }

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
