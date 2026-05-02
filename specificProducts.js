import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("The compiling reached here");

function getCategoryName(title) {
  if (title.startsWith("Roasted")) return "roasted_nuts";
  if (title.startsWith("Raw")) return "raw_nuts";
  if (title.startsWith("Dates")) return "dates";
  if (title.startsWith("Dried")) return "driedfruits";
  if (title.startsWith("Candies")) return "candiesandjellies";
  if (title.startsWith("Chocolate")) return "chocolate_gifts";
  if (title.startsWith("Chinese")) return "chinese";
  if (title.startsWith("Seeds")) return "seeds";
  if (title.startsWith("Coffee")) return "coffee";
  return null;
}

router.get("/products/:title", async (req, res) => {
  const title = decodeURIComponent(req.params.title);
  const categoryName = getCategoryName(title);

  if (!categoryName) {
    return res.status(400).json({
      success: false,
      message: "Invalid category",
    });
  }
  console.log("the category name is: "+categoryName);

  try {
    const { data: category, error: categoryError } = await supabase
      .from("Categories")
      .select("Categories_id")
      .eq("name", categoryName)
      .single();

    if (categoryError || !categoryId) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    const categoryId = category.Categories_id;
  console.log("the category id is: "+categoryId);

    const { data, error } = await supabase
      .from("Roastery_Products")
      .select("*")
      .eq("Categories_id", categoryId);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: error.message,
      });
    }

    res.json(data || []);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

export default router;
