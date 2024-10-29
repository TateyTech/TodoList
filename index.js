//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoDb_connect_url = process.env.MONGODB_URI || "mongodb+srv://Admin-seiha:Seiha123@cluster0.8fulo.mongodb.net/todolistD";

mongoose.connect(mongoDb_connect_url)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const itemsSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const Item = mongoose.model("Item", itemsSchema);

const ItemsData = [
  { name: "Welcome to your Todo List!" },
  { name: "Hit the + button to add a new item." },
  { name: "<-- Hit this to delete an item." }
];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        return Item.insertMany(ItemsData)
          .then(() => {
            console.log("Successfully saved itemsData to DB.");
            res.redirect("/"); // Redirect to the root route after saving
          })
          .catch((err) => {
            res.status(500).send("Error saving items to the database.");
            console.log(err);
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error retrieving items from the database.");
    });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: ItemsData
        });

        return list.save().then(() => {
          res.redirect("/" + customListName);
        });
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error finding or saving the list");
    });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save()
      .then(() => res.redirect("/"))
      .catch(err => {
        console.error("Error saving item:", err);
        res.status(500).send("An error occurred while saving the item.");
      });
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        if (foundList) {
          foundList.items.push(item);
          return foundList.save();
        } else {
          throw new Error("List not found");
        }
      })
      .then(() => res.redirect("/" + listName))
      .catch(err => {
        console.error("Error finding or saving the list:", err);
        res.status(500).send("An error occurred while processing the list.");
      });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
        res.status(500).send("Error deleting item from the database.");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      { new: true }
    )
      .then(foundList => {
        if (foundList) {
          res.redirect("/" + listName);
        } else {
          res.status(404).send("List not found");
        }
      })
      .catch(err => {
        console.error(err);
        res.status(500).send("Error deleting item from the list.");
      });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
