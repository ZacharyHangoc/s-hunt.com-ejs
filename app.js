require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//require the passport packages installed through npm
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");


mongoose.connect("mongodb://localhost:27017/solohuntDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

//setup user schema to use passportLocalMongoose as a plugin
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home");
});


app.get("/pricing", function(req,res){
    res.render("pricing");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
