//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Creating mongoDB for todolist using "mongoose" instead saving data in arrays
mongoose.connect("mongodb+srv://admin-arjun:Test123@cluster0.vipcp.mongodb.net/todolistDB", { useNewUrlParser: true });
// Creating Schema for "items"
const itemsSchema = {
    name: String
};
// Creating model collection for storing contents
const Item = mongoose.model("Item", itemsSchema);

// Creating new item inside Item model
const item1 = new Item({ //item1
    name: "Welcome to our Todo List"
});

const item2 = new Item({ //item2
    name: "Hit the + button to add new items"
});

const item3 = new Item({ //item3
    name: "<-- Hit this to delete an item"
});

//Creating a listSchema for user input in url
const listSchema = {
    name: String, //Title
    items: [itemsSchema] //items acc. to itemsSchema
};
// List model
const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3]; // Adding those items inside default array

app.get("/", function(req, res) {
    // Displaying & Rendering foundItems array to list.ejs
    Item.find({}, function(err, foundItems) {

        if (foundItems.length === 0) {
            // Inserting all items (in array) into Item model
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items");
                }
            });
            res.redirect("/") //Redirects & displays the default items to home only when it was empty before
        } else {
            // Once it isn't empty it stops inserting default items
            // console.log(foundItems);
            res.render("list", { listTitle: "Today", newListItems: foundItems }); // Renders to list.ejs
        }

    });

});

//Creating custom list for userinput in url
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    //Finds whether customlistname entered by user present in DB
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                //If not found, Creates new lists
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save(); //This saves the first new list but then stops 
                res.redirect("/" + customListName); //This redirect only enables further lists to redirected to the user given route name
            } else {
                //If found, Displays only existing lists
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });
});

app.post("/", function(req, res) {

    const itemName = req.body.newItem; // new home item
    const listName = req.body.list; // list title name (home)

    const item = new Item({
        name: itemName // home item name
    });

    if (listName === "Today") { // If list home means
        item.save(); // Just save
        res.redirect("/"); // and redirected to Home route
    } else { // if it is custom List by user input
        List.findOne({ name: listName }, function(err, foundList) { // Then we are extracting the "listName"
            foundList.items.push(item); // and pushing the items to that custom list
            foundList.save(); // Saving it
            res.redirect("/" + listName); // Redirected to custom route
        });
    }
});

//For deleting items from list.ejs
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted");
                res.redirect("/")
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});