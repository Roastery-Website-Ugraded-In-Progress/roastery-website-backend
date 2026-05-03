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

    if (categoryError || !category) {
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
router.post("/add-product", async (req, res) => {
  const { product_name, image, price_per_kg, description, categories_id } = req.body;
    if (!product_name || !image || !price_per_kg || !categories_id) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }
  try {
    // Insert product into Supabase
    const { data, error } = await supabase
      .from("Roastery_Products")
      .insert([
        {
          Product_name: product_name,
          Image: image,
          Price_per_kg: price_per_kg,
          Description: description,
          Categories_id: categories_id,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: "Product added successfully",
      data,
    });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
router.delete("/delete-product", async (req, res) => {
  const { Product_id } = req.body;

  if (!Product_id) {
    return res.status(400).json({
      success: false,
      message: "Product_id is required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("Roastery_Products")
      .delete()
      .eq("Product_id", Product_id)
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Delete failed",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      data,
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

export default router;
