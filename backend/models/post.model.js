import mongoose from "mongoose"

const postSchema=new mongoose.Schema({
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    description:{
        type:String,
        default:""
    },
    image:{
        type:String
    },
    like:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    comment:[
        {
            content:{type:String},
            user:{
                type: mongoose.Schema.Types.ObjectId,
                ref:"User" 
            }
        }
    ],
    // New field for reposting:
    repostOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: null
    }

},{timestamps:true})

const Post=mongoose.model("Post",postSchema)
export default Post
