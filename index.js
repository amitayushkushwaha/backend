const express = require("express");
// require("dotenv").config();
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/post");
const Comment=require("./models/comment");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads" });
const fs = require("fs");



main().catch((err) => console.log(err));
async function main() {
  try {
    mongoose.connect(
      process.env.LINK,
      {
        serverSelectionTimeoutMS: 5000,
      }
    );
  } catch (error) {
    console.log("there is an error in connection", error);
  }
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use('/uploads',express.static(__dirname+'/uploads'));
app.get("/test", (req, res) => {
  res.json("test ok");
});
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  console.log(username);
  try {
    const userDoc = await User.create({ username, password, email });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json(e);
  }
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  const userDoc = await User.findOne({ username });
  if (userDoc && userDoc.password === password) {
    // user login
    jwt.sign({ username, id: userDoc._id }, process.env.SECRET, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).json("ok");
      console.log(token);
    });
  } else {
    // wrong ceredential
    res.status(400).json("wrong credentials");
  }
});

app.get("/profile", (req, res) => {
  console.log(req.body);
  const { token } = req.cookies;
  const a = token ?? "";

  console.log(token); 

  console.log(a.length);
  if (a.length != 0) {
    jwt.verify(token, process.env.SECRET, {}, (err, info) => {
      if (err) throw err;
      res.json(info);
    });
  } else {
    res.json("");
  }
});

app.post("/signout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);
  const { username, title, summary } = req.body;
  const postDoc = await Post.create({
    username,
    title,
    summary,
    cover: newPath,
  });
  res.json(postDoc);
});
app.post('/comment', async (req,res)=>{
  const { username, comment,blog,time } = req.body;
  try {
    const userDoc = await Comment.create({ username, comment,blog,time });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json(e);
  }

});
app.get('/comment', async (req,res)=>{
  const comments= await Comment.find().sort({createdAt: -1});
  res.json(comments);
})

app.get('/post',async(req,res)=>{
  const posts=await Post.find().sort({createdAt: -1}).limit(20);
  res.json(posts);
})
// app.listen(4000, () => {
//   console.log("successfully connected on server 4000");
// });

app.listen(process.env.PORT, () => {
  console.log("Server running...");
});

