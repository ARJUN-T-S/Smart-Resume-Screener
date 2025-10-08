import mongoose from "mongoose";

const Resume=new mongoose.Schema({
    groupId:{type:Schema.Types.ObjectId,ref:"Groups"},
    recruiterId:{type:String,ref:"Recruiters"},
    candidateName:{type:String},
    email:{type:String},
    extractedText:{type:String},
    skills:[{type:String}],
    education:{type:String},
    experience:{
        type:String
    },
    totalExperience:{type:Number},
    uploadDate:{type:Date,default:Date.now}
})

export default mongoose.model("Resume",Resume);