import mongoose from "mongoose";
const {Schema}=mongoose;
const Comparisons=new mongoose.Schema({
    groupId:{
        type: Schema.Types.ObjectId,ref:"Groups"
    },
    recruiterId:{
        type:String,ref:"Recruiters"
    },
    resumeId:{type: Schema.Types.ObjectId,ref:"Resume"},
    jobId:{
        type: Schema.Types.ObjectId,ref:"JobDescriptions"
    },
    matchScore:{type:Number,requried:true},
    SkillOverLap:{type:Number,required:true},
    Justification:{type:String,required:true},
    pros:[{type:String}],
    cons:[{type:String}],
    createdAt:{type:Date,default:Date.now}
})

export default mongoose.model("Comparisons",Comparisons);