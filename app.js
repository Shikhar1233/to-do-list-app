const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const env = require("dotenv");

const app = express();
const port = 3000;

env.config();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(process.env.MONGODB_URI_KEY, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let day = date.day();

/* items Schema */
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: true
  },
});
const Item = mongoose.model("Item", itemsSchema);
const firstItem = new Item({
  name: "finsih the current module",
});
const secondItem = new Item({
  name: "drink some coffee",
});

const arrOfItems = [firstItem, secondItem];
/** --items Schema-- */

/* list Schema */
const ListSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  items: [itemsSchema],
});

const List = mongoose.model("List", ListSchema);
/* --list Schema-- */

/* user list options Schema */
const userListSchema = new mongoose.Schema({
  "List Name": {
    type: String,
  },
});
const userListOptions = mongoose.model("List Option", userListSchema);
/* --user list options Schema-- */

/**get Home Route */
app.get("/", (req, res) => {
  let userLists = userListOptions.find({});
  userLists.then((list) => {
    res.render("../index", {
      userLists: list,
    });
  });
});
/** --get Home Route-- */

/** post Home Route */
app.post("/", (req, res) => {
  let ListName = _.capitalize(req.body["ListName-input"]);
  if (ListName.length !== 0) {
    userListOptions
      .findOne({
        "List Name": ListName,
      })
      .then((name) => {
        if (name) {
          console.log("List Name already exist => " + name["List Name"]);
        } else {
          // console.log("listName =>", ListName);
          const listToAdd = new userListOptions({
            "List Name": ListName,
          });
          listToAdd
            .save()
            .then(() => {
              res.redirect("/");
              console.log("user list added successfully");
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("Already exists");
    res.redirect("/");
  }
});

/** --post Home Route-- */

/** post delete workSpace Route */

app.post("/workDelete", (req, res) => {
  let workListID = req.body.workSpace;
  List.find({}).then((foundList) => {
    if (foundList.length > 0) {
      // if the user want to delete the options but the ame option is already present in list doucment
      foundList.forEach((list) => {
        userListOptions.find({}).then((userList) => {
          userList.forEach((user) => {
            // console.log("List =>> ", list.name);
            // console.log("userList =>> ", user["List Name"]);
            console.log(
              _.capitalize(list.name) === _.capitalize(user["List Name"])
            );
            if (_.capitalize(list.name) === _.capitalize(user["List Name"])) {
              userListOptions
                .findByIdAndRemove(workListID)
                .then((deletedItems) => {
                  console.log(
                    `Item deleted from work list  =>   ${deletedItems["List Name"]} with id ${deletedItems.id}`
                  );
                  List.findOneAndRemove(list.name).then((deletedItems) => {
                    console.log(
                      `Item deleted from list  =>   ${deletedItems.name} with id ${deletedItems.id}`
                    );
                  });
                  res.redirect("/");
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          });
        });
      });
    } else {
      userListOptions.findByIdAndRemove(workListID).then((deletedItems) => {
        console.log(
          `Item deleted from work list2  =>   ${deletedItems["List Name"]} with id ${deletedItems.id}`
        );
        res.redirect("/");
      });
    }
  });
});

/** --post delete workSpace Route-- */

/** get list Route */
app.get("/list/home", (req, res) => {
  let myItems = Item.find({});

  myItems.then((items) => {
    // add the default items if the database is empty
    if (items.length === 0) {
      Item.insertMany(arrOfItems)
        .then(() => {
          console.log("Items inserted");
        })
        .catch((err) => {
          console.log(err);
        });
      res.redirect("/list/home"); // redirect to list when the default items are inserted
    } else {
      // if there is already an items in the database
      res.render("list", {
        currentDay: day,
        items,
      });
    }
  });
});

/** --get list Route-- */
let reqParams;
/** post list Route */
app.post("/list/home", (req, res) => {
  let itemName = req.body.newItem;
  let listName = req.body.currentList;
  if (itemName.length !== 0) {
    const itemToAdd = new Item({
      name: itemName,
    });
    console.log("req.Params 2 => ", reqParams);
    // check if i am already in the List/home page
    if (listName !== reqParams) {
      console.log("req.Params 2 => ", reqParams);
      itemToAdd
        .save()
        .then(() => {
          res.redirect("/list/home");
          console.log("item added successfully");
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      // if im in the custom list that added bt user
      List.findOne({
        name: listName,
      }).then((foundList) => {
        foundList.items.push(itemToAdd); // add the toDoList to the custom list that added by user
        foundList.save();
        res.redirect("/list/" + listName);
      });
    }
  } else {
    if (listName !== "") {
      // console.log("listName 3 => ", listName);
      // console.log("req.Params 3 => ", reqParams);
      res.redirect("/list/" + listName);
    } else {
      // console.log("listName 4 => ", listName);
      // console.log("req.Params 4 => ", reqParams);

      res.redirect("/list/home");
    }
  }
});
/** --post list Route-- */

/** post delete Route */
app.post("/delete", (req, res) => {
  const checkedItemId = req.body["item-checkbox"];
  const CurrentListName = req.body.ListName;

  if (CurrentListName !== reqParams) {
    Item.findByIdAndRemove(checkedItemId)
      .then((deletedItems) => {
        console.log(
          `Item deleted =>  ${deletedItems.name} with id ${deletedItems.id}`
        );
        res.redirect("/list/home");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      {
        name: CurrentListName,
      },
      {
        $pull: {
          items: {
            _id: checkedItemId,
          },
        },
      }
    )
      .then((foundList) => {
        console.log(`Item deleted =>  ${foundList}`);
        res.redirect("/list/" + CurrentListName);
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/list/" + CurrentListName);
      });
  }
});

/** --post delete Route-- */

/** get of different dynamic Routes */
app.get("/list/:listType", (req, res) => {
  let listTypeName = _.capitalize(req.params.listType);
  reqParams = listTypeName;

  console.log("req.Params 1 => ", reqParams);

  List.findOne({
    name: listTypeName,
  })
    .then((list) => {
      if (!list) {
        const list = new List({
          name: listTypeName,
          items: arrOfItems,
        });
        list.save();
        res.redirect("/list/" + reqParams);
      } else {
        res.render("list", {
          currentDay: day,
          items: list.items,
          listTitle: list.name,
        });
      }
      
    })
    .catch((err) => {
      console.log(err);
    });
});

/** --get of different dynamic Routes-- */

app.listen(port, () => {
  console.log("Server started on port 3000");
});

/* const weekday = new Array(
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
    );
*/
// weekday: weekday[currentDay]
