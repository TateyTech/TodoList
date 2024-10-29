// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Use environment variable for MongoDB connection URL
const mongoDb_connect_url = process.env.MONGODB_URI || "mongodb+srv://Admin-seiha:Seiha123@cluster0.8fulo.mongodb.net/todolistD"; // Default for local testing

// Connect to MongoDB
mongoose.connect(mongoDb_connect_url)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(error => console.error("MongoDB connection error:", error));

// Item schema and model
const itemsSchema = new mongoose.Schema({ name: { type: String, required: true } });
const Item = mongoose.model("Item", itemsSchema);

// List schema and model
const listSchema = new mongoose.Schema({ name: String, items: [itemsSchema] });
const List = mongoose.model("List", listSchema);

// Default items
const ItemsData = [
  { name: "Welcome to your Todo List!" },
  { name: "Hit the + button to add a new item." },
  { name: "<-- Hit this to delete an item." }
];

// Root route
app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(ItemsData);
      return res.redirect("/"); // Redirect after inserting items
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error("Error retrieving items:", err);
    res.status(500).send("Error retrieving items from the database.");
  }
});

// Custom list route
app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      const list = new List({ name: customListName, items: ItemsData });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error("Error finding or saving the list:", err);
    res.status(500).send("Error finding or saving the list.");
  }
});

// Add item
app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });

  try {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      }
    }
  } catch (err) {
    console.error("Error saving item:", err);
    res.status(500).send("An error occurred while saving the item.");
  }
});

// Delete item
app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndDelete(checkedItemId);
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } },
        { new: true }
      );
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).send("Error deleting item from the list.");
  }
});

// About page
app.get("/about", (req, res) => {
  res.render("about");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
