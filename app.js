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

//Set our session to have a secret and some settings
app.use(
  session({
    secret: "little secret",
    resave: false,
    saveUninitialized: false,
  })
);

//initialize Passport
app.use(passport.initialize());
//Use Passport to manage our session
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

//setup user schema to use passportLocalMongoose as a plugin
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//passportLocalMongoose to create a local login strategy
passport.use(User.createStrategy());

//Setup passport to serialize & Deserialize the user
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      scope: ["profile"],
      state: true,
    },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile);
      User.findOne({ googleId: profile.id })
        .then((user) => {
          if (!user) {
            user = new User({
              googleId: profile.id,
            });
            user
              .save()
              .then(() => done(null, user))
              .catch((err) => done(err));

            //found user
          } else {
            done(null, user);
          }
        })
        .catch((err) => done(err));
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log("Error");
    }

    res.redirect("/");
  });
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
