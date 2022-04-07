require("dotenv").config()
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const passport = require("passport")
const flash = require("express-flash")
const session = require("express-session")
const methodOverride = require("method-override")
const User = require("./models/User")
const bcrypt = require("bcryptjs")
const {
  checkAuthenticated,
  checkNotAuthenticated,
} = require("./middleware/auth")



const port = process.env.PORT || 5000

const initializePassport = require("./passport-config")
initializePassport(
  passport,
  async (email) => {
    const userFound = await User.findOne({ email })
    return userFound
  },
  async (id) => {
    const userFound = await User.findOne({ _id: id })
    return userFound
  }
)

app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(flash())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
)
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride("_method"))
app.use(express.static("public"))

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index", { name: req.user.name });
})

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register")
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login")
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register", checkNotAuthenticated, async (req, res) => {
  const userFound = await User.findOne({ email: req.body.email })

  if (userFound) {
    req.flash("error", "User with that email already exists")
    res.redirect("/register")
  } else {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      })

      await user.save();
      res.redirect("/login")
    } catch (error) {
      console.log(error)
      res.redirect("/register")
    }
  }
})

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login")
});

mongoose
  .connect("mongodb+srv://genki:genki1234@cluster0.7xjyv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'DB connection error:'));
db.once('open', () => console.log('DB connection successful'));

app.listen(port, () => console.log(`Express Server listening on port ${port}!`));