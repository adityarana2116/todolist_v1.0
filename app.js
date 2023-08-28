const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
var dotenv = require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

var url = process.env.MONGODB_URI;
mongoose.connect(url, {useNewUrlParser: true}).then(
  app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
  })).catch(err => console.log(err));

const itemSchema = mongoose.Schema({
  task:String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
  task:"Welcome to your To-Do List!"
});

const item2 = new Item ({
  task:"Click the + button to add a new item."
});

const item3 = new Item ({
  task:"Check the box to delete an item."
});


const listSchema = mongoose.Schema({
  name:String,
  items: [itemSchema] 
});

const List = mongoose.model("List", listSchema);

const day = date.getDate();

app.get("/", function(req, res) {

  Item.find({}).then( function (FoundItems){
    if (FoundItems.length === 0){
      Item.insertMany([item1,item2,item3]);
      console.log(FoundItems);
      res.redirect("/");
    }else{
    res.render("list", {listTitle: day, newListItems:FoundItems});
    }
  })
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then( (foundItem) => {
    if (!foundItem){
      //Create a new list
      const list = new List({
    name: customListName,
    items: [item1,item2,item3]
  });
  list.save();
  res.redirect("/" +customListName);
    }else{
      //Show existing list
      res.render("list", {listTitle: foundItem.name, newListItems:foundItem.items});
    }
  });
  
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
    
  const newTask = new Item({
    task: itemName
  });

  if (listName === day){
  newTask.save();
  res.redirect("/");
  }else{
    List.findOne({name:listName}).then( (foundList) =>{
      // console.log(foundList);
      foundList.items.push(newTask);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
  
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === day){
    Item.findByIdAndRemove(req.body.checkbox).then( () => res.redirect("/"));
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}}).then( () => res.redirect("/"+listName));
  }
  
});

