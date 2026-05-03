router.get("/item/:name_of_the_category/:title", async (req, res) => {
  const name_of_the_category = decodeURIComponent(req.params.name_of_the_category);
  const title = decodeURIComponent(req.params.title);

  try {
    let categoryAttribute = getCategoryAttributeFromCategory(name_of_the_category);

    if (!categoryAttribute && title === "Coffee") {
      categoryAttribute = "coffee";
    }

    if (!categoryAttribute) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const { data: catData, error: catError } = await supabase
      .from("Categories")
      .select("Categories_id")
      .eq("name", categoryAttribute)
      .single();

    if (catError || !catData) {
      return res.status(404).json({ error: "Category not found" });
    }

    const categoryId = catData.Categories_id;

    const { data, error } = await supabase
      .from("Roastery_Products")
      .select("*")
      .eq("Categories_id", categoryId)
      .eq("Product_name", title)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Server error" });
  }
});
