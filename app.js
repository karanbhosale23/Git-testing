const express = require("express");
const app = express();

const path = require('path');
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set("view engine" , "ejs");
app.use(express.json());
app.use(express.urlencoded({extended :true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());

app.get("/",(req,res)=>{
   res.render("index.ejs");
});

app.get("/login",(req,res)=>{
    res.render("login.ejs");
 });

 app.get("/profile",isLoggedIn,async(req,res)=>{
   let user = await userModel.findOne({email : req.user.email}).populate("posts");
    res.render("profile",{user});
 })

 app.post("/post",isLoggedIn,async(req,res)=>{
  let user = await userModel.findOne({email:req.user.email});
  let{content} = req.body;

let post = await postModel.create({
    user : user._id,
    content : content 
  });

  user.posts.push(post._id);
   await user.save();
   res.redirect("/profile");

 });
 

app.post('/register',async(req,res)=>{
    let { email ,password, username ,name ,age} = req.body;

  let user =await userModel.findOne({email})
  if(user) return res.status(500).send("User already registered");

  bcrypt.genSalt(10,(err ,salt)=>{  // keep the password safe 
    bcrypt.hash(password,salt , async(err,hash)=>{
      let user= await userModel.create({
            username,
            email,
            age,
            name,
            password :hash
        });

     let token = jwt.sign({email : email, userid : user._id},"secret");
     res.cookie('token',token);
        res.send("registered");
    })
  })
});

app.post('/login',async(req,res)=>{
    let { email ,password} = req.body;

  let user =await userModel.findOne({email})
  if(!user) return res.status(500).send("Something went Wrong");

  bcrypt.compare(password,user.password ,function(err,result){
    if(result){ 
        let token = jwt.sign({email: email , userid :user._id},"secret");
        res.cookie("token",token);
        res.status(200).redirect("/profile");
    }
    else res.redirect("/login");
  })
});

app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
});

function isLoggedIn(req ,res ,next){
    if(req.cookies.token =="") res.redirect("/login");
    else{
       let data = jwt.verify(req.cookies.token ,"secret");
       req.user = data;
       next();
    }
}


app.listen(3000,(req,res)=>{
    console.log("connected to server");
});