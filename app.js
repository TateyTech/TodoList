// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Use environment variable for MongoDB connection URL
const mongoDb_connect_url = process.env.MONGODB_URI || "mongodb+srv://Admin-seiha:Seiha123@cluster0.8fulo.mongodb.net/todolistD"; // Default for local testing

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDb_connect_url);
    console.log("MongoDB connected.");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

// Call connectDB when handling a request
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  next();
});

// Schema 1: Create item Schema
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

// Create the item Model
const Item = mongoose.model("Item", itemsSchema);

// Array of the document to insert to the database 
const ItemsData = [
  { name: "Welcome to your Todo List!" },
  { name: "Hit the + button to add a new item." },
  { name: "<-- Hit this to delete an item." }
];

// Schema 2: for customListName 
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

// Model 2: 
const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});

    // If there are no items, insert the default documents
    if (foundItems.length === 0) {
      await Item.insertMany(ItemsData);
      console.log("Successfully saved itemsData to DB.");
      return res.redirect("/"); // Redirect to the root route after saving
    } else {
      // Render the list with existing items
      return res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error retrieving items from the database.");
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      // Create a new list 
      const list = new List({
        name: customListName,
        items: ItemsData
      });
      await list.save();
      return res.redirect("/" + customListName); // Redirect to the newly created list
    } else {
      // Show an existing list 
      return res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error finding or saving the list");
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  try {
    if (listName === "Today") {
      await item.save();
      return res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        return res.redirect("/" + listName);
      } else {
        throw new Error("List not found");
      }
    }
  } catch (err) {
    console.error("Error finding or saving the list:", err);
    return res.status(500).send("An error occurred while processing the list.");
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndDelete(checkedItemId);
      console.log("Successfully deleted checked item.");
      return res.redirect("/"); // Redirect to the home page after deletion
    } else {
      const foundList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } },
        { new: true }  // This option returns the modified document
      );
      if (foundList) {
        return res.redirect("/" + listName); // Redirect if the list was found and updated
      } else {
        return res.status(404).send("List not found"); // Handle case where list is not found
      }
    }
  } catch (err) {
    console.error(err); // Log the error if the update fails
    return res.status(500).send("Error deleting item from the list."); // Optional error response
  }
});

const PORT = process.env.PORT || 3000;

// Start the server
if (require.main === module) {
  app.listen(PORT, function () {
    console.log(`Server started on port ${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
