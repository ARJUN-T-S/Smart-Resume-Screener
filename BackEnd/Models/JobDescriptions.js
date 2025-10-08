import mongoose from "mongoose";

const JobDescriptions=new mongoose.Schema({
    recruiterId:{type:String,ref:"Recruiters"},
    title:{type:String},
    companyName:{type:String},
    jdText:{type:String},
    requriedSkills:[{
        type:String
    }],
    location:{
        type:String
    },
    createdAt:{type:Date,default:Date.now}
})

export default mongoose.model("JobDescriptions",JobDescriptions);