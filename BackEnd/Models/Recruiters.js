import mongoose from "mongoose";

const Recruiters = new mongoose.Schema({
  userId:{type:String,required:true},
  name: { type: String, required: true },
  email:{
    type:String,required:true
  }
});

export default mongoose.model("Recruiters", Recruiters);
