const express = require('express')
const jwt= require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const path = require('path')
const ejs = require('ejs')
const userModel = require('./models/user')
const postModel = require('./models/post')
const port = 3000;
const upload = require('./config/multerconfig')
const app = express();

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser());



app.get('/', function(req, res){
    res.render('index')
})

app.get('/login', function(req, res){
    res.render('login')
})

app.get('/profile/uploads', isLogedIn ,function(req, res){
    res.render('profileupload')
})

app.post('/upload', isLogedIn, upload.single('image') ,async function(req, res){
    let user = await userModel.findOne({email: req.user.email})
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect('/profile')
})

app.get('/profile', isLogedIn, async (req, res) =>{
    let user = await userModel.findOne({email: req.user.email}).populate('posts'); 
    res.render('profile', {user});
})

app.get('/like/:id', isLogedIn, async (req, res) =>{
    let post = await postModel.findOne({_id: req.params.id}).populate('user')
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }
    await post.save()
    res.redirect('/profile')
})

app.get('/edit/:id', isLogedIn, async (req, res) =>{
    let post = await postModel.findOne({_id: req.params.id}).populate('user')
    res.render('edit', {post})
})

app.post('/update/:id', isLogedIn, async (req, res) =>{
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.newThoghts})
    res.redirect('/profile')
})

app.post('/post', isLogedIn, async (req, res) =>{
    let user = await userModel.findOne({email: req.user.email})    
    let{thoghts} = req.body;

    let post = await postModel.create({
        user: user._id,
        content: thoghts
    })
    user.posts.push(post._id);
    await user.save()
    res.redirect('/profile')
})

app.post('/register', async function(req, res){
    let{name, username, password, email, age} = req.body;
    let user = await userModel.findOne({email: email})
    if(user) return res.send('user already exist')
        
        bcrypt.genSalt(10, (err, salt) =>{
            bcrypt.hash(password, salt, async (err, hash) =>{
                let user = await userModel.create({
                    name,
                    username,
                    email,
                    password:hash,
                    age
                });
                let token = jwt.sign({email:email, userid: user._id}, "secretkey");
                res.cookie("token", token);
                res.redirect('/profile')
            })
        })

})

app.post('/login', async function(req, res){
    let{password, email} = req.body;
    let user = await userModel.findOne({email: email})
    if(!user) return res.send('user not exist')
        
        bcrypt.compare(password, user.password, (err, result) =>{
            if(result){
                let token = jwt.sign({email:email, userid: user._id}, "secretkey");
                res.cookie("token", token);
                res.redirect('/profile')
            }
                else res.send('password incorrect')
        })
        
})

app.get('/logout', function(req, res){
    res.cookie('token', "")
    res.redirect('/login')
})

function isLogedIn(req,res, next) {
    const token = req.cookies.token;
    if(!token){
        return res.status(401).redirect('/login')
    }
    try{
        const data = jwt.verify(token, "secretkey");
        req.user = data;
        next();
    }
    catch(err){
        return res.status(401).send('invalid token')
    }
}


app.listen(port, function(){
    console.log(`app is rnning on port no ${port}`);
    
})