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
user_route.post("/save-chat", auth.isLogin, userController.saveChat);
user_route.post("/delete-chat", auth.isLogin, userController.deleteChat);
user_route.post("/update-chat", auth.isLogin, userController.updateChat);
user_route.get("/groups", auth.isLogin, userController.loadGroups);
user_route.post(
  "/groups",
  upload.array("image", 5),
  userController.createGroup
);
user_route.post("/get-members", auth.isLogin, userController.getMembers);
user_route.post("/add-members", auth.isLogin, userController.addMembers);
user_route.post(
  "/update-chat-group",
  auth.isLogin,
  upload.array("image", 5),
  userController.updateChatGroup
);
user_route.post(
  "/delete-chat-group",
  auth.isLogin,
  userController.deleteChatGroup
);
user_route.get("/share-group/:id", userController.shareGroup);
user_route.post("/join-group", auth.isLogin, userController.joinGroup);
user_route.get("/group-chat", auth.isLogin, userController.groupChats);
user_route.post("/group-save-chat", auth.isLogin, userController.saveGroupChat);
user_route.post(
  "/load-group-chats",
  auth.isLogin,
  userController.loadGroupChat
);
user_route.post(
  "/delete-group-chat",
  auth.isLogin,
  userController.deleteGroupChat
);
user_route.post(
  "/update-group-chat",
  auth.isLogin,
  userController.updateGroupChat
);

user_route.get("*", function (req, res) {
  res.redirect("/");``
});
module.exports = user_route;
