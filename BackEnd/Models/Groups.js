import mongoose from "mongoose";

const Groups=new mongoose.Schema({
    groupName:{type:String,required:true},
    userId:{
        type:String,ref:"Recruiters"
    }
})

export default mongoose.model("Groups",Groups)