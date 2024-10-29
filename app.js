//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Use environment variable for MongoDB connection URL
const mongoDb_connect_url = process.env.MONGODB_URI || "mongodb+srv://Admin-seiha:Seiha123@cluster0.8fulo.mongodb.net/todolistD"; // Default for local testing

//Using New Database inside MongoDB
mongoose.connect(mongoDb_connect_url)

//Schema 1: Create item Schema
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }

});

// Create the item Model
const Item = mongoose.model("Item", itemsSchema);

//Array of the document to insert to the database 
const ItemsData = [
  { name: "Welcome to your Todo List !" },
  { name: "Hit the + button to add a new item." },
  { name: "<-- Hit this to delete an item." }
];

//Schema 2: for customListName 
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

// Model 2: 
const List = mongoose.model("List", listSchema);


// // Find and log items
// Item.find({})
//   .then(foundItems => {
//     console.log(foundItems);
//   })
//   .catch((err) => {
//     console.log(err);
//   });


app.get("/", function (req, res) {

  // Find and log items
  Item.find({})

    .then(foundItems => {
      // if there is any items, insert the doc to the database 
      if (foundItems.length === 0) {
        Item.insertMany(ItemsData)
          .then(() => {
            console.log("Successfully saved itemsData to DB.");
            res.redirect("/"); // Redirect to the root route after saving
          })
          .catch((err) => {
            res.status(500).send("Error saving items to the database.");
            console.log(err);
          });
        // redirect to the roote route 
        res.redirect("/");
      } else {
        // Render the list with existing items
        // console.log(foundItems);
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
      // Display all data in log
      //console.log(foundItems);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error retrieving items from the database.");
    });
});

app.get("/:customListName", function (req, res) {
  // lodah rule: _.capitalize([string=''])
  const customListName = _.capitalize(req.params.customListName);

  // Find the listName
  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        // Create a new list 
        const list = new List({
          name: customListName,
          items: ItemsData // Ensure ItemsData is defined in your scope
        });

        // Save the new list and redirect
        return list.save().then(() => {
          res.redirect("/" + customListName); // Redirect to the newly created list
        });
      } else {
        // Show an existing list 
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error finding or saving the list");
    });
});




app.get("/about", function (req, res) {
  res.render("about");
});



app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

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



app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/"); // Redirect to the home page after deletion
      })
      .catch((err) => {
        console.log(err); // Log the error if deletion fails
        res.status(500).send("Error deleting item from the database."); // Optional error response
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      { new: true }  // This option returns the modified document
    )
      .then(foundList => {
        if (foundList) {
          res.redirect("/" + listName); // Redirect if the list was found and updated
        } else {
          res.status(404).send("List not found"); // Handle case where list is not found
        }
      })
      .catch(err => {
        console.error(err); // Log the error if the update fails
        res.status(500).send("Error deleting item from the list."); // Optional error response
      });
  }
});




// const PORT = process.env.PORT || 3000;

// app.listen(PORT, function () {
//   console.log(`Server started on port ${PORT}`);
// });

// Export the app for Vercel
module.exports = app;