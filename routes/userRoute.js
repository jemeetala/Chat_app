const express = require("express");
const auth = require("../middlewares/auth.js");

const path = require("path");
const multer = require("multer");

const user_route = express();

const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
user_route.use(cookieParser());
user_route.use(
  session({
    secret: process.env.SESSION_SECRET || "thisismysessionsecret",
    resave: false,
    saveUninitialized: true,
  })
);

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));
user_route.set("view engine", "ejs");
user_route.set("views", "./views");

user_route.use(express.static("public"));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const userController = require("../controllers/userController");
user_route.get("/register", auth.isLogout, userController.registerLoad);
user_route.post(
  "/register",
  upload.array("images", 5),
  userController.register
);
user_route.get("/", auth.isLogout, userController.loadLogin);
user_route.post("/", userController.login);
user_route.get("/logout", auth.isLogin, userController.logout);

user_route.get("/dashboard", auth.isLogin, userController.loadDashboard);
user_route.post("/save-chat", userController.saveChat);
user_route.post("/delete-chat", userController.deleteChat);
user_route.post("/update-chat", userController.updateChat);

user_route.get("*", function (req, res) {
  res.redirect("/");
});
module.exports = user_route;
