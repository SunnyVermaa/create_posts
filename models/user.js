
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://sunnyvermaa:freefire1947@cluster0.ydlf2.mongodb.net/blogProjects");

const userSchema = mongoose.Schema({
    name:String,
    username: String,
    email:String,
    password:String,
    age:Number,
    profilepic:{
        type:String,
        default:"default.jpg"
    },
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'post'
    }]
})

module.exports = mongoose.model('user', userSchema);