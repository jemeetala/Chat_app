const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const Group = require("../models/groupModel");
const GroupChat = require("../models/groupChatModel");
const Member = require("../models/memberModel");

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const registerLoad = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

const register = async (req, res) => {
  try {
    const images = req?.files?.map((file) => file.buffer.toString("base64"));
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      image: images[0],
      password: passwordHash,
    });
    await user.save();
    res.render("register", {
      message: "your registration has been successfully.",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      const { image, ...userDataWithoutImage } = userData.toObject(); // Exclude image from user data

      if (passwordMatch) {
        req.session.user = userData;
        res.cookie("user", JSON.stringify(userDataWithoutImage));

        res.redirect("/dashboard");
      } else {
        res.render("login", { message: "Email and password is Incorrect" });
      }
    } else {
      res.render("login", { message: "Email and password is Incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("user");
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};
const loadDashboard = async (req, res) => {
  try {
    var users = await User.find({ _id: { $nin: [req.session.user._id] } });
    res.render("dashboard", { user: req.session.user, users: users });
  } catch (error) {
    console.log(error.message);
  }
};
const saveChat = async (req, res) => {
  try {
    var chat = new Chat({
      sender_id: req.body.sender_id,
      receiver_id: req.body.receiver_id,
      message: req.body.message,
    });
    var newChat = await chat.save();
    res
      .status(200)
      .send({ success: true, msg: "chat inserted!", data: newChat });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const deleteChat = async (req, res) => {
  try {
    await Chat.deleteOne({ _id: req.body.id });
    res.status(200).send({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const updateChat = async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          message: req.body.message,
        },
      }
    );
    res.status(200).send({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};

const loadGroups = async (req, res) => {
  try {
    var groups = await Group.find({ creator_id: req?.session?.user?._id });

    res.render("group", { groups: groups });
  } catch (error) {
    console.log(error.message);
  }
};

const createGroup = async (req, res) => {
  try {
    const images = req?.files?.map((file) => file.buffer.toString("base64"));
    const group = new Group({
      creator_id: req.session.user._id,
      name: req.body.name,
      limit: req.body.limit,
      image: images[0],
    });
    await group.save();

    var groups = await Group.find({ creator_id: req.session.user._id });

    res.redirect(
      `/groups?message=${encodeURIComponent(
        `${req.body.name} group created successfully`
      )}`
    );
  } catch (error) {
    console.log(error.message);
  }
};
const getMembers = async (req, res) => {
  try {
    // var users = await User.find({ _id: { $nin: [req.session.user._id] } });
    var users = await User.aggregate([
      {
        $lookup: {
          from: "members",
          localField: "_id",
          foreignField: "user_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$group_id",
                        new mongoose.Types.ObjectId(req.body.group_id),
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "member",
        },
      },
      {
        $match: {
          _id: {
            $nin: [new mongoose.Types.ObjectId(req.session.user._id)],
          },
        },
      },
    ]);

    res.status(200).send({ success: true, data: users });
  } catch (error) {
    res.status(400).send({ success: false, msg: error.message });
  }
};
const addMembers = async (req, res) => {
  try {
    if (!req.body.members) {
      res
        .status(200)
        .send({ success: false, msg: "please select any one member " });
    } else if (req.body.members.length > parseInt(req.body.limit)) {
      res.status(200).send({
        success: false,
        msg: "you can not select more than " + req.body.limit + "members.",
      });
    } else {
      await Member.deleteMany({ group_id: req.body.group_id });
      var data = [];
      const members = req.body.members;
      for (let i = 0; i < members.length; i++) {
        data.push({
          group_id: req.body.group_id,
          user_id: members[i],
        });
      }
      await Member.insertMany(data);
      res.status(200).send({ success: true, msg: "member inserted!" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const updateChatGroup = async (req, res) => {
  try {
    if (parseInt(req.body.limit) < parseInt(req.body.last_limit)) {
      await Member.deleteMany({ group_id: req.body.id });
    }
    var group;
    if (req?.files !== undefined) {
      const images = req?.files?.map((file) => file.buffer.toString("base64"));
      group = {
        name: req.body.name,
        limit: req.body.limit,
        image: images[0],
      };
    } else {
      group = {
        name: req.body.name,
        limit: req.body.limit,
      };
    }

    await Group.findByIdAndUpdate({ _id: req.body.id }, { $set: group });
    res
      .status(200)
      .send({ success: true, msg: "Chat Group updated successfully!" });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const deleteChatGroup = async (req, res) => {
  try {
    await Group.findByIdAndDelete({ _id: req.body.id });

    await Member.deleteMany({ group_id: req.body.id });

    res
      .status(200)
      .send({ success: true, msg: "Chat Group deleted successfully!" });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const shareGroup = async (req, res) => {
  try {
    var groupData = await Group.findOne({ _id: req.params.id });
    if (!groupData) {
      res.render("error", { message: "404 not found" });
    } else if (req.session.user == undefined) {
      res.render("error", {
        message: "You need to login to access share URL!!!",
      });
    } else {
      var totalMembers = await Member.find({ group_id: req.params.id });
      var available = groupData.limit - totalMembers.length;
      var isOwner = groupData.creator_id == req.session.user._id ? true : false;
      var isJoined = await Member.find({
        $and: [{ group_id: req.params.id }, { user_id: req.session.user._id }],
      });
      res.render("shareLink", {
        group: groupData,
        totalMembers: totalMembers.length,
        available: available,
        isOwner: isOwner,
        isJoined: isJoined.length,
      });
    }
    res
      .status(200)
      .send({ success: true, msg: "Chat Group share successfully!" });
  } catch (error) {
    console.log(error.message);
  }
};
const joinGroup = async (req, res) => {
  try {
    const member = new Member({
      group_id: req.body.group_id,
      user_id: req.session.user._id,
    });
    await member.save();
    res
      .status(200)
      .send({ success: true, msg: "Chat Group share successfully!" });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const groupChats = async (req, res) => {
  try {
    const myGroups = await Group.find({ creator_id: req.session.user._id });
    const joinedGroups = await Member.find({
      user_id: req.session.user._id,
    }).populate("group_id");
    res.render("chat-group", {
      myGroups: myGroups,
      joinedGroups: joinedGroups,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const saveGroupChat = async (req, res) => {
  try {
    var chat = new GroupChat({
      sender_id: req.body.sender_id,
      group_id: req.body.group_id,
      message: req.body.message,
    });
    var newChat = await chat.save();
    var cChat = await GroupChat.findOne({
      _id: newChat._id,
    }).populate("sender_id");
    res
      .status(200)
      .send({ success: true, msg: "group chat inserted!", chat: cChat });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const loadGroupChat = async (req, res) => {
  try {
    const groupChats = await GroupChat.find({
      group_id: req.body.group_id,
    }).populate("sender_id");
    res.status(200).send({ success: true, chats: groupChats });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const deleteGroupChat = async (req, res) => {
  try {
    await GroupChat.deleteOne({ _id: req.body.id });
    res.status(200).send({ success: true, msg: "chat deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
const updateGroupChat = async (req, res) => {
  try {
    await GroupChat.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: { message: req.body.message } }
    );
    res.status(200).send({ success: true, msg: "chat updated" });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ success: false, msg: error.message });
  }
};
module.exports = {
  register,
  registerLoad,
  loadLogin,
  login,
  logout,
  loadDashboard,
  saveChat,
  deleteChat,
  updateChat,
  loadGroups,
  createGroup,
  getMembers,
  addMembers,
  updateChatGroup,
  deleteChatGroup,
  shareGroup,
  joinGroup,
  groupChats,
  saveGroupChat,
  loadGroupChat,
  deleteGroupChat,
  updateGroupChat,
};
